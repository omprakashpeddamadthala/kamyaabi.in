package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record BlogCategoryRequest(
        @NotBlank(message = "Category name is required")
        String name,

        String slug,

        String description,

        Long parentId
) {
}
