package com.kamyaabi.dto.request;

import com.kamyaabi.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateUserStatusRequest(
        @NotNull(message = "Status is required")
        User.Status status
) {
}
