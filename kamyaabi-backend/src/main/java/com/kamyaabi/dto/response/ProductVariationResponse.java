package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ProductVariationResponse(
        Long id,
        String slug,
        String weight,
        String unit,
        BigDecimal price,
        BigDecimal discountPrice,
        Integer stock,
        String mainImageUrl
) {
}
