package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record WishlistItemResponse(
        Long id,
        Long productId,
        String productName,
        String productSlug,
        String productImageUrl,
        BigDecimal productPrice,
        BigDecimal productDiscountPrice,
        boolean inStock,
        LocalDateTime addedAt
) {
}
