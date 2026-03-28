package com.kamyaabi.controller;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private AuthServiceImpl authService;
    @Mock private CurrentUser currentUser;

    @InjectMocks private AuthController authController;

    @Test
    void googleLogin_shouldReturnAuthResponse() {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", "test@kamyaabi.in");
        AuthResponse authResponse = AuthResponse.builder().token("jwt-token")
                .user(UserResponse.builder().id(1L).email("test@kamyaabi.in").build()).build();
        when(authService.processGoogleUser(userInfo)).thenReturn(authResponse);

        ResponseEntity<?> response = authController.googleLogin(userInfo);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getCurrentUser_shouldReturnUserResponse() {
        UserResponse userResponse = UserResponse.builder().id(1L).email("test@kamyaabi.in").name("Test").role("USER").build();
        when(currentUser.getUserId()).thenReturn(1L);
        when(authService.getCurrentUser(1L)).thenReturn(userResponse);

        ResponseEntity<?> response = authController.getCurrentUser();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
