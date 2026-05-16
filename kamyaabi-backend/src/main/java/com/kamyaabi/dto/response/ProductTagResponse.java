package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ProductTagResponse(
        Long id,
        String name,
        String slug,
        Integer productCount,
        LocalDateTime createdAt
) {
}
