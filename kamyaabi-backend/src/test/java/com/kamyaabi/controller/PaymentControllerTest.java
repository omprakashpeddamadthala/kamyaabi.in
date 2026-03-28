package com.kamyaabi.controller;

import com.kamyaabi.dto.request.PaymentVerifyRequest;
import com.kamyaabi.dto.response.PaymentResponse;
import com.kamyaabi.dto.response.RazorpayOrderResponse;
import com.kamyaabi.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock private PaymentService paymentService;

    @InjectMocks private PaymentController paymentController;

    @Test
    void createOrder_shouldReturnRazorpayOrder() {
        RazorpayOrderResponse razorpayResponse = RazorpayOrderResponse.builder()
                .razorpayOrderId("order_123").amount(new BigDecimal("1498.00"))
                .currency("INR").orderId(1L).keyId("rzp_test").build();
        when(paymentService.createRazorpayOrder(1L)).thenReturn(razorpayResponse);

        ResponseEntity<?> response = paymentController.createOrder(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void verifyPayment_shouldReturnPaymentResponse() {
        PaymentVerifyRequest request = PaymentVerifyRequest.builder()
                .orderId(1L).razorpayOrderId("order_123")
                .razorpayPaymentId("pay_123").razorpaySignature("sig_123").build();
        PaymentResponse paymentResponse = PaymentResponse.builder()
                .id(1L).razorpayOrderId("order_123").amount(new BigDecimal("1498.00")).status("COMPLETED").build();
        when(paymentService.verifyPayment(request)).thenReturn(paymentResponse);

        ResponseEntity<?> response = paymentController.verifyPayment(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
