package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Builder
public record ProductResponse(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        BigDecimal discountPrice,
        String imageUrl,
        String mainImageUrl,
        List<ProductImageResponse> images,
        Long categoryId,
        String categoryName,
        Integer stock,
        String weight,
        String unit,
        String shelfLife,
        Map<String, String> nutritionalInfo,
        List<String> howToUse,
        List<String> storageTips,
        Boolean active,
        LocalDateTime createdAt
) {
}
