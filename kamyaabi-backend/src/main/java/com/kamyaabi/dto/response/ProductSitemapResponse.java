package com.kamyaabi.dto.response;

import java.time.LocalDateTime;

public record ProductSitemapResponse(
        String slug,
        String name,
        String categorySlug,
        String imageUrl,
        String mainImageUrl,
        LocalDateTime updatedAt,
        LocalDateTime createdAt
) {
}
