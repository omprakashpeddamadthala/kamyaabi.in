package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record BlogTagRequest(
        @NotBlank(message = "Tag name is required")
        String name,

        String slug,

        String description
) {
}
