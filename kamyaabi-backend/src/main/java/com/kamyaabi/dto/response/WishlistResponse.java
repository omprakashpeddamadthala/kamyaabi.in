package com.kamyaabi.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record WishlistResponse(
        Long id,
        List<WishlistItemResponse> items,
        int totalItems
) {
}
