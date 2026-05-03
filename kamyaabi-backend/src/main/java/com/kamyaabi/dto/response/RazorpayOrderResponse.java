package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record RazorpayOrderResponse(
        String razorpayOrderId,
        BigDecimal amount,
        String currency,
        Long orderId,
        String keyId
) {
}
