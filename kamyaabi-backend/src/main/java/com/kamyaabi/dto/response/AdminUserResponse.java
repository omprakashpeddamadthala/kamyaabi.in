package com.kamyaabi.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record AdminUserResponse(
        Long id,
        String email,
        String name,
        String avatarUrl,
        String role,
        String status,
        LocalDateTime createdAt
) {
}
