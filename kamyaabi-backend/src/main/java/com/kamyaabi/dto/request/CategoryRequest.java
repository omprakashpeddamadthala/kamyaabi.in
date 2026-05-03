package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record CategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 120, message = "Category name must be at most 120 characters")
        String name,

        @Pattern(regexp = "^$|^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Slug must be lowercase letters/numbers separated by hyphens")
        @Size(max = 160, message = "Slug must be at most 160 characters")
        String slug,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        String imageUrl,

        Long parentId
) {
}
