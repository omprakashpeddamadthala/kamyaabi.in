package com.kamyaabi.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record PackageDimensionSettingRequest(
        @NotNull(message = "Package weight limit (grams) is required")
        @Min(value = 1, message = "Weight limit must be at least 1 gram")
        Integer packageWeightGram,

        @NotNull(message = "Length is required")
        @Min(value = 1, message = "Length must be greater than 0")
        Integer length,

        @NotNull(message = "Breadth is required")
        @Min(value = 1, message = "Breadth must be greater than 0")
        Integer breadth,

        @NotNull(message = "Height is required")
        @Min(value = 1, message = "Height must be greater than 0")
        Integer height,

        Boolean active
) {
}
