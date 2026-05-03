package com.kamyaabi.service.impl;

import com.kamyaabi.config.AppProperties;
import com.kamyaabi.dto.request.PaymentVerifyRequest;
import com.kamyaabi.dto.response.PaymentResponse;
import com.kamyaabi.dto.response.RazorpayOrderResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.Payment;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.PaymentException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.PaymentMapper;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.PaymentRepository;
import com.kamyaabi.event.OrderEventPublisher;
import com.kamyaabi.event.OrderEventType;
import com.razorpay.Utils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockedStatic;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentMapper paymentMapper;
    @Mock private AppProperties appProperties;
    @Mock private OrderEventPublisher orderEventPublisher;

    @InjectMocks private PaymentServiceImpl paymentService;

    private Order order;
    private Payment payment;
    private PaymentResponse paymentResponse;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).email("test@kamyaabi.in").name("Test").role(User.Role.USER).build();
        order = Order.builder().id(1L).user(user)
                .totalAmount(new BigDecimal("1498.00")).status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>()).build();
        payment = Payment.builder().id(1L).order(order).amount(new BigDecimal("1498.00"))
                .razorpayOrderId("order_123").status(Payment.PaymentStatus.PENDING).build();
        paymentResponse = PaymentResponse.builder().id(1L).razorpayOrderId("order_123")
                .amount(new BigDecimal("1498.00")).status("PENDING").build();
    }

    @Test
    void createRazorpayOrder_orderNotFound_shouldThrowException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.createRazorpayOrder(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createRazorpayOrder_orderAlreadyPaid_shouldThrowException() {
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.createRazorpayOrder(1L))
                .isInstanceOf(PaymentException.class)
                .hasMessageContaining("already been processed");
    }

    @Test
    void createRazorpayOrder_existingPendingPayment_shouldReturnExistingWithoutCallingRazorpay() {
        payment.setStatus(Payment.PaymentStatus.PENDING);
        AppProperties.Razorpay razorpayProps = new AppProperties.Razorpay();
        razorpayProps.setKeyId("rzp_test_key");
        razorpayProps.setKeySecret("rzp_test_secret");

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));
        when(appProperties.getRazorpay()).thenReturn(razorpayProps);

        RazorpayOrderResponse response = paymentService.createRazorpayOrder(1L);

        assertThat(response).isNotNull();
        assertThat(response.razorpayOrderId()).isEqualTo("order_123");
        assertThat(response.orderId()).isEqualTo(1L);
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("1498.00"));
        assertThat(response.keyId()).isEqualTo("rzp_test_key");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void createRazorpayOrder_existingFailedPayment_shouldThrowException() {
        payment.setStatus(Payment.PaymentStatus.FAILED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderId(1L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.createRazorpayOrder(1L))
                .isInstanceOf(PaymentException.class)
                .hasMessageContaining("already been processed");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void verifyPayment_paymentNotFoundByRazorpayOrderId_shouldThrowException() {
        PaymentVerifyRequest request = PaymentVerifyRequest.builder()
                .orderId(1L).razorpayOrderId("order_nonexistent")
                .razorpayPaymentId("pay_123").razorpaySignature("sig_123").build();
        when(paymentRepository.findByRazorpayOrderId("order_nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.verifyPayment(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void verifyPayment_paymentFoundButOrderMissing_shouldThrowException() {
        PaymentVerifyRequest request = PaymentVerifyRequest.builder()
                .orderId(1L).razorpayOrderId("order_123")
                .razorpayPaymentId("pay_123").razorpaySignature("sig_123").build();
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.verifyPayment(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void verifyPayment_validSignature_shouldMarkOrderPaidAndPublishEvent() {
        PaymentVerifyRequest request = PaymentVerifyRequest.builder()
                .orderId(1L).razorpayOrderId("order_123")
                .razorpayPaymentId("pay_123").razorpaySignature("sig_123").build();

        AppProperties.Razorpay razorpayProps = new AppProperties.Razorpay();
        razorpayProps.setKeyId("rzp_test_key");
        razorpayProps.setKeySecret("rzp_test_secret");

        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));
        when(appProperties.getRazorpay()).thenReturn(razorpayProps);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentMapper.toResponse(any(Payment.class))).thenReturn(paymentResponse);

        try (MockedStatic<Utils> mockedUtils = Mockito.mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(), eq("rzp_test_secret")))
                    .thenReturn(true);

            PaymentResponse response = paymentService.verifyPayment(request);

            assertThat(response).isNotNull();
            assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAID);
            assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.COMPLETED);
            assertThat(payment.getRazorpayPaymentId()).isEqualTo("pay_123");
            assertThat(payment.getRazorpaySignature()).isEqualTo("sig_123");
            verify(orderRepository).save(order);
            verify(paymentRepository).save(payment);
            verify(orderEventPublisher).publishOrderEvent(order, OrderEventType.PAYMENT_SUCCESS);
        }
    }

    @Test
    void verifyPayment_invalidSignature_shouldMarkOrderPaymentFailed() {
        PaymentVerifyRequest request = PaymentVerifyRequest.builder()
                .orderId(1L).razorpayOrderId("order_123")
                .razorpayPaymentId("pay_123").razorpaySignature("bad_sig").build();

        AppProperties.Razorpay razorpayProps = new AppProperties.Razorpay();
        razorpayProps.setKeyId("rzp_test_key");
        razorpayProps.setKeySecret("rzp_test_secret");

        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));
        when(appProperties.getRazorpay()).thenReturn(razorpayProps);

        try (MockedStatic<Utils> mockedUtils = Mockito.mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(), eq("rzp_test_secret")))
                    .thenReturn(false);

            assertThatThrownBy(() -> paymentService.verifyPayment(request))
                    .isInstanceOf(PaymentException.class)
                    .hasMessageContaining("invalid signature");

            assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAYMENT_FAILED);
            assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.FAILED);
            verify(orderEventPublisher).publishOrderEvent(order, OrderEventType.PAYMENT_FAILED);
        }
    }

    @Test
    void verifyPayment_alreadyCompleted_shouldShortCircuit() {
        PaymentVerifyRequest request = PaymentVerifyRequest.builder()
                .orderId(1L).razorpayOrderId("order_123")
                .razorpayPaymentId("pay_123").razorpaySignature("sig_123").build();

        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));
        when(paymentMapper.toResponse(payment)).thenReturn(paymentResponse);

        PaymentResponse response = paymentService.verifyPayment(request);

        assertThat(response).isNotNull();
        verify(orderRepository, never()).save(any());
        verify(orderEventPublisher, never()).publishOrderEvent(any(), any());
    }
}
