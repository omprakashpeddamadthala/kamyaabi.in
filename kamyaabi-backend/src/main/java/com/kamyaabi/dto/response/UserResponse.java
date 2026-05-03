package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record UserResponse(
        Long id,
        String email,
        String name,
        String avatarUrl,
        String role,
        String status
) {
}
