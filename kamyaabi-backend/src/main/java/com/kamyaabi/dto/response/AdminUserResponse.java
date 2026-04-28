package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User row used by the /api/admin/users table. Includes sensitive metadata
 * (creation date, status, role) that is only safe to surface to admins.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String email;
    private String name;
    private String avatarUrl;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}
