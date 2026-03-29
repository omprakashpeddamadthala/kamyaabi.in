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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
        order.setPayment(payment);
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.createRazorpayOrder(1L))
                .isInstanceOf(PaymentException.class)
                .hasMessageContaining("already completed");
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
}
