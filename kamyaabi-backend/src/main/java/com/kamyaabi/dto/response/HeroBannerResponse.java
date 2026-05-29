package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record HeroBannerResponse(
        Long id,
        String imageUrl,
        String title,
        String subtitle,
        String altText,
        String linkUrl,
        Integer displayOrder,
        Boolean active
) {
}
