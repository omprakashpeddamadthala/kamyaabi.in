package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 120, message = "Category name must be at most 120 characters")
    private String name;

    /**
     * URL slug. When blank the service generates one from {@code name};
     * when supplied it must match the URL-safe pattern below so it can be
     * embedded in routes without extra encoding.
     */
    @Pattern(regexp = "^$|^[a-z0-9]+(?:-[a-z0-9]+)*$",
            message = "Slug must be lowercase letters/numbers separated by hyphens")
    @Size(max = 160, message = "Slug must be at most 160 characters")
    private String slug;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    private String imageUrl;

    /** Optional parent category id; null means top-level. */
    private Long parentId;
}
