package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Builder
public record ProductRequest(
        @NotBlank(message = "Product name is required")
        String name,

        String description,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be positive")
        BigDecimal price,

        BigDecimal discountPrice,

        String imageUrl,

        @NotNull(message = "Category ID is required")
        Long categoryId,

        @NotNull(message = "Stock is required")
        @Positive(message = "Stock must be positive")
        Integer stock,

        String weight,

        String unit,

        String shelfLife,

        Map<String, String> nutritionalInfo,

        List<String> howToUse,

        List<String> storageTips,

        Boolean active
) {
}
