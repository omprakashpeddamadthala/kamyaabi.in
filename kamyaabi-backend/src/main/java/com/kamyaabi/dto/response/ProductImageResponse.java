package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record ProductImageResponse(
        Long id,
        String imageUrl,
        String publicId,
        Boolean isMain,
        Integer displayOrder
) {
}
