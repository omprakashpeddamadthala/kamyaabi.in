package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record PaymentResponse(
        Long id,
        String razorpayOrderId,
        String razorpayPaymentId,
        BigDecimal amount,
        String status,
        LocalDateTime createdAt
) {
}
