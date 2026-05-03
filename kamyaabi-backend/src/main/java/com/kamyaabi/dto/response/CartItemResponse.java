package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        String productImageUrl,
        BigDecimal productPrice,
        BigDecimal productDiscountPrice,
        Integer quantity,
        BigDecimal subtotal
) {
}
