package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record ReviewResponse(
        Long id,
        String authorName,
        String title,
        Integer rating,
        String text,
        List<String> images,
        Long userId,
        LocalDateTime createdAt
) {
}
