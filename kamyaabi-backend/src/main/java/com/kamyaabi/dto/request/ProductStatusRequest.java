package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record ProductStatusRequest(
        @NotNull(message = "active flag is required")
        Boolean active
) {
}
