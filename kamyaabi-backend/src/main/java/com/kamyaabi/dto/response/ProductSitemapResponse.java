package com.kamyaabi.dto.response;

import java.time.LocalDateTime;

public record ProductSitemapResponse(
        String slug,
        String categorySlug,
        LocalDateTime updatedAt,
        LocalDateTime createdAt
) {
}
