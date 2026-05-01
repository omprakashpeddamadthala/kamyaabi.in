package com.kamyaabi.service;

import com.kamyaabi.dto.response.AdminUserResponse;
import com.kamyaabi.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {

    Page<AdminUserResponse> getAllUsers(String search, Pageable pageable);

    AdminUserResponse updateUserRole(Long targetUserId, Long actorUserId, User.Role role);

    AdminUserResponse updateUserStatus(Long targetUserId, Long actorUserId, User.Status status);
}
