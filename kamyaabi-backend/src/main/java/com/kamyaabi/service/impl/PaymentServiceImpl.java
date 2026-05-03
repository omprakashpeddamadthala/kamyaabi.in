package com.kamyaabi.service.impl;

import com.kamyaabi.config.AppProperties;
import com.kamyaabi.dto.request.PaymentVerifyRequest;
import com.kamyaabi.dto.response.PaymentResponse;
import com.kamyaabi.dto.response.RazorpayOrderResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.Payment;
import com.kamyaabi.exception.PaymentException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.PaymentMapper;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.PaymentRepository;
import com.kamyaabi.service.PaymentService;
import com.kamyaabi.event.OrderEventPublisher;
import com.kamyaabi.event.OrderEventType;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentMapper paymentMapper;
    private final AppProperties appProperties;
    private final OrderEventPublisher orderEventPublisher;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              OrderRepository orderRepository,
                              PaymentMapper paymentMapper,
                              AppProperties appProperties,
                              OrderEventPublisher orderEventPublisher) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.paymentMapper = paymentMapper;
        this.appProperties = appProperties;
        this.orderEventPublisher = orderEventPublisher;
    }

    @Override
    public RazorpayOrderResponse createRazorpayOrder(Long orderId) {
        log.info("Creating Razorpay order for order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        Optional<Payment> existing = paymentRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            Payment existingPayment = existing.get();
            Payment.PaymentStatus status = existingPayment.getStatus();

            if (status == Payment.PaymentStatus.PENDING) {
                log.info("Reusing existing PENDING Razorpay order {} for order {}",
                        existingPayment.getRazorpayOrderId(), orderId);
                return RazorpayOrderResponse.builder()
                        .razorpayOrderId(existingPayment.getRazorpayOrderId())
                        .amount(existingPayment.getAmount())
                        .currency("INR")
                        .orderId(orderId)
                        .keyId(appProperties.getRazorpay().getKeyId())
                        .build();
            }

            throw new PaymentException(
                    "Payment for order " + orderId + " has already been processed (status=" + status + ")");
        }

        try {
            RazorpayClient razorpay = new RazorpayClient(
                    appProperties.getRazorpay().getKeyId(),
                    appProperties.getRazorpay().getKeySecret());

            long amountInPaise = order.getTotalAmount().multiply(new BigDecimal("100")).longValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_" + orderId);

            com.razorpay.Order razorpayOrder = razorpay.orders.create(orderRequest);

            String razorpayOrderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                    .order(order)
                    .razorpayOrderId(razorpayOrderId)
                    .amount(order.getTotalAmount())
                    .status(Payment.PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(payment);

            log.info("Razorpay order created: {}", razorpayOrderId);

            return RazorpayOrderResponse.builder()
                    .razorpayOrderId(razorpayOrderId)
                    .amount(order.getTotalAmount())
                    .currency("INR")
                    .orderId(orderId)
                    .keyId(appProperties.getRazorpay().getKeyId())
                    .build();

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order", e);
            throw new PaymentException("Failed to create payment order: " + e.getMessage(), e);
        }
    }

    @Override
    public PaymentResponse verifyPayment(PaymentVerifyRequest request) {
        log.info("Verifying payment for order: {}", request.orderId());

        Payment payment = paymentRepository.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for Razorpay order: " + request.razorpayOrderId()));

        if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
            log.info("Payment already completed for order: {}, skipping duplicate verification", request.orderId());
            return paymentMapper.toResponse(payment);
        }

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", request.razorpayOrderId());
            attributes.put("razorpay_payment_id", request.razorpayPaymentId());
            attributes.put("razorpay_signature", request.razorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(attributes,
                    appProperties.getRazorpay().getKeySecret());

            if (isValid) {
                payment.setRazorpayPaymentId(request.razorpayPaymentId());
                payment.setRazorpaySignature(request.razorpaySignature());
                payment.setStatus(Payment.PaymentStatus.COMPLETED);

                Order order = payment.getOrder();
                order.setStatus(Order.OrderStatus.PAID);
                orderRepository.save(order);

                Payment saved = paymentRepository.save(payment);
                log.info("Payment verified successfully for order: {}", request.orderId());

                orderEventPublisher.publishOrderEvent(order, OrderEventType.PAYMENT_SUCCESS);

                return paymentMapper.toResponse(saved);
            } else {
                payment.setStatus(Payment.PaymentStatus.FAILED);
                paymentRepository.save(payment);

                Order order = payment.getOrder();
                order.setStatus(Order.OrderStatus.PAYMENT_FAILED);
                orderRepository.save(order);

                orderEventPublisher.publishOrderEvent(order, OrderEventType.PAYMENT_FAILED);

                throw new PaymentException("Payment verification failed - invalid signature");
            }
        } catch (RazorpayException e) {
            log.error("Payment verification failed", e);
            payment.setStatus(Payment.PaymentStatus.FAILED);
            paymentRepository.save(payment);

            Order order = payment.getOrder();
            order.setStatus(Order.OrderStatus.PAYMENT_FAILED);
            orderRepository.save(order);

            orderEventPublisher.publishOrderEvent(order, OrderEventType.PAYMENT_FAILED);

            throw new PaymentException("Payment verification failed: " + e.getMessage(), e);
        }
    }
}
