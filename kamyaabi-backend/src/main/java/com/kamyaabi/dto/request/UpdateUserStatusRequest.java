package com.kamyaabi.dto.request;

import com.kamyaabi.entity.User;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserStatusRequest {
    @NotNull(message = "Status is required")
    private User.Status status;
}
