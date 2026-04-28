package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.AdminUserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.AdminUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;

    public AdminUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAllUsers(String search, Pageable pageable) {
        Page<User> page;
        if (search != null && !search.isBlank()) {
            page = userRepository.findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
                    search.trim(), search.trim(), pageable);
        } else {
            page = userRepository.findAll(pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    public AdminUserResponse updateUserRole(Long targetUserId, Long actorUserId, User.Role role) {
        if (role == null) {
            throw new BadRequestException("Role is required");
        }
        if (actorUserId != null && actorUserId.equals(targetUserId)) {
            throw new BadRequestException("Admins cannot modify their own role");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));
        user.setRole(role);
        User saved = userRepository.save(user);
        log.info("Admin {} updated role of user {} to {}", actorUserId, targetUserId, role);
        return toResponse(saved);
    }

    @Override
    public AdminUserResponse updateUserStatus(Long targetUserId, Long actorUserId, User.Status status) {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        if (actorUserId != null && actorUserId.equals(targetUserId)) {
            throw new BadRequestException("Admins cannot block or unblock their own account");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));
        user.setStatus(status);
        User saved = userRepository.save(user);
        log.info("Admin {} updated status of user {} to {}", actorUserId, targetUserId, status);
        return toResponse(saved);
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .status(user.getStatus() != null ? user.getStatus().name() : User.Status.ACTIVE.name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
