package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record ProductTagRequest(
        @NotBlank(message = "Tag name is required")
        String name,

        String slug
) {
}
