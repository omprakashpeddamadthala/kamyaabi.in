package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        String imageUrl,
        Long parentId,
        String parentName,
        Integer productCount,
        LocalDateTime updatedAt
) {
}
