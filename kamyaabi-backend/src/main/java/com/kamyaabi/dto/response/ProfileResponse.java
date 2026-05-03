package com.kamyaabi.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record ProfileResponse(
        Long id,
        String email,
        String name,
        String firstName,
        String lastName,
        String avatarUrl,
        String role,
        List<AddressResponse> addresses
) {
}
