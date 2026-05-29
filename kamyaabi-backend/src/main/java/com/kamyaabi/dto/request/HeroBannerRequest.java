package com.kamyaabi.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Builder;

/**
 * Metadata for creating/updating a homepage hero banner. The image itself is
 * sent as a separate multipart file part on create / image-replace.
 */
@Builder
public record HeroBannerRequest(
        @Size(max = 255, message = "Title must be at most 255 characters")
        String title,

        @Size(max = 1024, message = "Subtitle must be at most 1024 characters")
        String subtitle,

        @Size(max = 255, message = "Alt text must be at most 255 characters")
        String altText,

        @Size(max = 1024, message = "Link URL must be at most 1024 characters")
        String linkUrl,

        Integer displayOrder,

        Boolean active
) {
}
