package com.kamyaabi.dto.request;

import com.kamyaabi.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required")
        User.Role role
) {
}
