package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record CouponValidationResponse(
        boolean valid,
        String code,
        String discountType,
        BigDecimal discountValue,
        BigDecimal discountAmount,
        String message
) {
}
