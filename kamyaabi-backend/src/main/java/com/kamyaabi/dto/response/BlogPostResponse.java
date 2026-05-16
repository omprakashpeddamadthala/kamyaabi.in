package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record BlogPostResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String content,
        String coverImageUrl,
        String coverImageAlt,
        Long authorId,
        String authorName,
        String authorAvatarUrl,
        String status,
        LocalDateTime publishedAt,
        LocalDateTime scheduledAt,
        List<BlogCategoryResponse> categories,
        List<BlogTagResponse> tags,
        String seoTitle,
        String seoDescription,
        String seoKeywords,
        String ogImageUrl,
        String canonicalUrl,
        Integer readingTimeMinutes,
        Integer viewCount,
        Boolean isFeatured,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
