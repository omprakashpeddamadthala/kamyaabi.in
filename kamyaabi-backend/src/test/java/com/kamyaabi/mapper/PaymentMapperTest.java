package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.PaymentResponse;
import com.kamyaabi.entity.Payment;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentMapperTest {

    private final PaymentMapper paymentMapper = new PaymentMapper();

    @Test
    void toResponse_shouldMapAllFields() {
        Payment payment = Payment.builder()
                .id(1L).razorpayOrderId("order_123").razorpayPaymentId("pay_123")
                .amount(new BigDecimal("1498.00")).status(Payment.PaymentStatus.COMPLETED)
                .build();

        PaymentResponse response = paymentMapper.toResponse(payment);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.razorpayOrderId()).isEqualTo("order_123");
        assertThat(response.razorpayPaymentId()).isEqualTo("pay_123");
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("1498.00"));
        assertThat(response.status()).isEqualTo("COMPLETED");
    }

    @Test
    void toResponse_pendingPayment_shouldMapStatus() {
        Payment payment = Payment.builder()
                .id(1L).razorpayOrderId("order_456")
                .amount(new BigDecimal("500.00")).status(Payment.PaymentStatus.PENDING)
                .build();

        PaymentResponse response = paymentMapper.toResponse(payment);

        assertThat(response.status()).isEqualTo("PENDING");
    }

    @Test
    void toResponse_failedPayment_shouldMapStatus() {
        Payment payment = Payment.builder()
                .id(1L).razorpayOrderId("order_789")
                .amount(new BigDecimal("200.00")).status(Payment.PaymentStatus.FAILED)
                .build();

        PaymentResponse response = paymentMapper.toResponse(payment);

        assertThat(response.status()).isEqualTo("FAILED");
    }
}
