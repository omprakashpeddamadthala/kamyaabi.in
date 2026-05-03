package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

@Builder
public record CartResponse(
        Long id,
        List<CartItemResponse> items,
        BigDecimal totalAmount,
        Integer totalItems
) {
}
