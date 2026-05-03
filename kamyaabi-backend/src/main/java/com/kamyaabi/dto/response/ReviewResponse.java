package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ReviewResponse(
        Long id,
        String authorName,
        Integer rating,
        String text,
        LocalDateTime createdAt
) {
}
