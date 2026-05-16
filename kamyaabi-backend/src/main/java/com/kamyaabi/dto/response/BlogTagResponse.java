package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record BlogTagResponse(
        Long id,
        String name,
        String slug,
        String description,
        Integer postCount,
        LocalDateTime createdAt
) {
}
