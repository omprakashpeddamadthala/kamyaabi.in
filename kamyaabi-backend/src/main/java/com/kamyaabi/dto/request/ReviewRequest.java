package com.kamyaabi.dto.request;

import jakarta.validation.constraints.*;

public record ReviewRequest(
        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        Integer rating,

        @Size(max = 100, message = "Title cannot exceed 100 characters")
        String title,

        @NotBlank(message = "Review text is required")
        @Size(min = 20, message = "Review text must be at least 20 characters")
        @Size(max = 1000, message = "Review text cannot exceed 1000 characters")
        String text
) {
}
