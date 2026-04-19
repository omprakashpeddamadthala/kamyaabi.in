package com.kamyaabi.controller;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.security.JwtTokenProvider;
import com.kamyaabi.service.AuthService;
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

    @Mock private AuthService authService;
    @Mock private CurrentUser currentUser;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @InjectMocks private AuthController authController;

    @Test
    void googleLogin_withIdToken_shouldReturnAuthResponse() {
        Map<String, Object> request = new HashMap<>();
        request.put("idToken", "valid-google-id-token");
        
        AuthResponse authResponse = AuthResponse.builder().token("jwt-token")
                .user(UserResponse.builder().id(1L).email("test@kamyaabi.shop").build()).build();
        when(authService.googleLogin("valid-google-id-token")).thenReturn(authResponse);

        ResponseEntity<?> response = authController.googleLogin(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void googleLogin_withUserInfo_shouldReturnAuthResponse() {
        Map<String, Object> request = new HashMap<>();
        request.put("email", "test@kamyaabi.shop");
        request.put("name", "Test User");
        request.put("picture", "http://avatar.url");
        request.put("sub", "google-123");
        
        AuthResponse authResponse = AuthResponse.builder().token("jwt-token")
                .user(UserResponse.builder().id(1L).email("test@kamyaabi.shop").build()).build();
        when(authService.processGoogleUser(request)).thenReturn(authResponse);

        ResponseEntity<?> response = authController.googleLogin(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void googleLogin_missingIdToken_shouldUseUserInfo() {
        Map<String, Object> request = new HashMap<>();
        request.put("email", "test@kamyaabi.shop");
        
        AuthResponse authResponse = AuthResponse.builder().token("jwt-token")
                .user(UserResponse.builder().id(1L).email("test@kamyaabi.shop").build()).build();
        when(authService.processGoogleUser(request)).thenReturn(authResponse);

        ResponseEntity<?> response = authController.googleLogin(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getCurrentUser_shouldReturnUserResponse() {
        UserResponse userResponse = UserResponse.builder().id(1L).email("test@kamyaabi.shop").name("Test").role("USER").build();
        when(currentUser.getUserId()).thenReturn(1L);
        when(authService.getCurrentUser(1L)).thenReturn(userResponse);

        ResponseEntity<?> response = authController.getCurrentUser();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
