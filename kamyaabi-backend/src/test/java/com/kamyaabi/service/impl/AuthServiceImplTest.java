package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.UserMapper;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private UserMapper userMapper;

    @InjectMocks private AuthServiceImpl authService;

    private User user;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("test@kamyaabi.in")
                .name("Test User")
                .avatarUrl("http://avatar.url")
                .googleId("google-123")
                .role(User.Role.USER)
                .build();

        userResponse = UserResponse.builder()
                .id(1L)
                .email("test@kamyaabi.in")
                .name("Test User")
                .avatarUrl("http://avatar.url")
                .role("USER")
                .build();
    }

    @Test
    void googleLogin_shouldThrowBadRequestException() {
        assertThatThrownBy(() -> authService.googleLogin("some-token"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void processGoogleUser_existingUser_shouldReturnAuthResponse() {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", "test@kamyaabi.in");
        userInfo.put("name", "Test User");
        userInfo.put("picture", "http://avatar.url");
        userInfo.put("sub", "google-123");

        when(userRepository.findByEmail("test@kamyaabi.in")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("jwt-token");
        when(userMapper.toResponse(any(User.class))).thenReturn(userResponse);

        AuthResponse response = authService.processGoogleUser(userInfo);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getUser()).isEqualTo(userResponse);
        verify(userRepository).findByEmail("test@kamyaabi.in");
    }

    @Test
    void processGoogleUser_newUser_shouldCreateAndReturnAuthResponse() {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", "new@kamyaabi.in");
        userInfo.put("name", "New User");
        userInfo.put("picture", "http://new-avatar.url");
        userInfo.put("sub", "google-new");

        when(userRepository.findByEmail("new@kamyaabi.in")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("jwt-token");
        when(userMapper.toResponse(any(User.class))).thenReturn(userResponse);

        AuthResponse response = authService.processGoogleUser(userInfo);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        verify(userRepository, atLeastOnce()).save(any(User.class));
    }

    @Test
    void processGoogleUser_existingUserWithUpdatedInfo_shouldUpdateUser() {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", "test@kamyaabi.in");
        userInfo.put("name", "Updated Name");
        userInfo.put("picture", "http://new-avatar.url");
        userInfo.put("sub", "new-google-id");

        when(userRepository.findByEmail("test@kamyaabi.in")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("jwt-token");
        when(userMapper.toResponse(any(User.class))).thenReturn(userResponse);

        authService.processGoogleUser(userInfo);

        verify(userRepository, atLeastOnce()).save(any(User.class));
    }

    @Test
    void getCurrentUser_existingUser_shouldReturnUserResponse() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        UserResponse response = authService.getCurrentUser(1L);

        assertThat(response.getEmail()).isEqualTo("test@kamyaabi.in");
    }

    @Test
    void getCurrentUser_notFound_shouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
