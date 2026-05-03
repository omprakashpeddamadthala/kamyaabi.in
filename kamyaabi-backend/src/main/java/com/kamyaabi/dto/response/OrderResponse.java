package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record OrderResponse(
        Long id,
        List<OrderItemResponse> items,
        BigDecimal totalAmount,
        String status,
        AddressResponse shippingAddress,
        PaymentResponse payment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
