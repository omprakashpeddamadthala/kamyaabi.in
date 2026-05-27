package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record CouponResponse(
        Long id,
        String code,
        String discountType,
        BigDecimal discountValue,
        Boolean isActive,
        LocalDateTime expiresAt,
        long usageCount,
        long uniqueMembers,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
