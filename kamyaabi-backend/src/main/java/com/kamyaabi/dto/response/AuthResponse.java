package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        UserResponse user
) {
}
