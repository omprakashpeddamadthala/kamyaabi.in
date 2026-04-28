package com.kamyaabi.service;

import com.kamyaabi.dto.response.AdminUserResponse;
import com.kamyaabi.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Admin-only operations for managing user accounts: paginated browsing,
 * promoting/demoting between {@link User.Role#USER} and
 * {@link User.Role#ADMIN}, and toggling account access via
 * {@link User.Status}.
 *
 * <p>Implementations must enforce a self-modification guard so an admin
 * cannot demote or block their own account and lock themselves out.
 */
public interface AdminUserService {

    Page<AdminUserResponse> getAllUsers(String search, Pageable pageable);

    AdminUserResponse updateUserRole(Long targetUserId, Long actorUserId, User.Role role);

    AdminUserResponse updateUserStatus(Long targetUserId, Long actorUserId, User.Status status);
}
