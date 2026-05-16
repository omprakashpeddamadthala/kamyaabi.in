package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record BlogCategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        Long parentId,
        String parentName,
        Integer postCount,
        LocalDateTime createdAt
) {
}
