package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.AdminUserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceImplTest {

    @Mock private UserRepository userRepository;

    @InjectMocks private AdminUserServiceImpl service;

    private User user;
    private User admin;

    @BeforeEach
    void setUp() {
        user = User.builder().id(2L).email("user@example.com").name("Reg User")
                .role(User.Role.USER).status(User.Status.ACTIVE).build();
        admin = User.builder().id(1L).email("admin@example.com").name("Admin")
                .role(User.Role.ADMIN).status(User.Status.ACTIVE).build();
    }

    @Test
    void getAllUsers_noSearch_returnsPageOfResponses() {
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(admin, user)));

        Page<AdminUserResponse> page = service.getAllUsers(null, pageable);

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getContent().get(0).getEmail()).isEqualTo("admin@example.com");
        assertThat(page.getContent().get(0).getStatus()).isEqualTo("ACTIVE");
        verify(userRepository, never()).findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
                any(), any(), any());
    }

    @Test
    void getAllUsers_blankSearch_fallsBackToFindAll() {
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(admin)));

        Page<AdminUserResponse> page = service.getAllUsers("   ", pageable);

        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void getAllUsers_withSearch_routesThroughSearchQuery() {
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
                eq("ad"), eq("ad"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(admin)));

        Page<AdminUserResponse> page = service.getAllUsers("ad", pageable);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getEmail()).isEqualTo("admin@example.com");
    }

    @Test
    void getAllUsers_userMissingStatus_defaultsToActive() {
        Pageable pageable = PageRequest.of(0, 10);
        User legacy = User.builder().id(3L).email("legacy@example.com").name("Legacy")
                .role(User.Role.USER).status(null).build();
        when(userRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(legacy)));

        Page<AdminUserResponse> page = service.getAllUsers(null, pageable);

        assertThat(page.getContent().get(0).getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void updateUserRole_promotesUserToAdmin() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = service.updateUserRole(2L, 1L, User.Role.ADMIN);

        assertThat(response.getRole()).isEqualTo("ADMIN");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(User.Role.ADMIN);
    }

    @Test
    void updateUserRole_demotesAdminToUser() {
        User someAdmin = User.builder().id(5L).email("a2@example.com").name("Admin2")
                .role(User.Role.ADMIN).status(User.Status.ACTIVE).build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(someAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = service.updateUserRole(5L, 1L, User.Role.USER);

        assertThat(response.getRole()).isEqualTo("USER");
    }

    @Test
    void updateUserRole_actorEqualsTarget_throws() {
        assertThatThrownBy(() -> service.updateUserRole(1L, 1L, User.Role.USER))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("own role");
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserRole_nullRole_throws() {
        assertThatThrownBy(() -> service.updateUserRole(2L, 1L, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Role is required");
    }

    @Test
    void updateUserRole_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateUserRole(99L, 1L, User.Role.USER))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateUserStatus_blocksUser() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = service.updateUserStatus(2L, 1L, User.Status.BLOCKED);

        assertThat(response.getStatus()).isEqualTo("BLOCKED");
    }

    @Test
    void updateUserStatus_unblocksUser() {
        user.setStatus(User.Status.BLOCKED);
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = service.updateUserStatus(2L, 1L, User.Status.ACTIVE);

        assertThat(response.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void updateUserStatus_actorEqualsTarget_throws() {
        assertThatThrownBy(() -> service.updateUserStatus(1L, 1L, User.Status.BLOCKED))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("own account");
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserStatus_nullStatus_throws() {
        assertThatThrownBy(() -> service.updateUserStatus(2L, 1L, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Status is required");
    }

    @Test
    void updateUserStatus_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateUserStatus(99L, 1L, User.Status.ACTIVE))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateUserRole_nullActor_allowsModification() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserResponse response = service.updateUserRole(2L, null, User.Role.ADMIN);

        assertThat(response.getRole()).isEqualTo("ADMIN");
    }
}
