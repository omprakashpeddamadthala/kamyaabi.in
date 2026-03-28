package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.AuthService;
import com.kamyaabi.service.impl.AuthServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthServiceImpl authService;
    private final CurrentUser currentUser;

    public AuthController(AuthServiceImpl authService, CurrentUser currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/google")
    @Operation(summary = "Google OAuth2 login", description = "Authenticate with Google OAuth2 and receive a JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody Map<String, Object> userInfo) {
        log.info("Google login request received");
        AuthResponse response = authService.processGoogleUser(userInfo);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get the currently authenticated user's details")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        Long userId = currentUser.getUserId();
        UserResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
