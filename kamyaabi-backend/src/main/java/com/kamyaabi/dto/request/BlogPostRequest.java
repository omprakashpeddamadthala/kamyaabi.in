package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record BlogPostRequest(
        @NotBlank(message = "Title is required")
        String title,

        String slug,

        @Size(max = 300, message = "Excerpt must be at most 300 characters")
        String excerpt,

        String content,

        String coverImageUrl,

        String coverImageAlt,

        String status,

        LocalDateTime scheduledAt,

        Set<Long> categoryIds,

        Set<Long> tagIds,

        String seoTitle,

        String seoDescription,

        String seoKeywords,

        String ogImageUrl,

        String canonicalUrl,

        Boolean isFeatured,

        Long authorId
) {
}
