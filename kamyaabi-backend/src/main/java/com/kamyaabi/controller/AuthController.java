package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.security.JwtTokenProvider;
import com.kamyaabi.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST endpoints for authentication: Google OAuth2 login (modern ID-token
 * flow + legacy user-info fallback), OAuth2 callbacks, and current-user
 * lookup. This controller delegates every operation to {@link AuthService}
 * and holds no business logic.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;
    private final CurrentUser currentUser;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(AuthService authService,
                          CurrentUser currentUser,
                          JwtTokenProvider jwtTokenProvider) {
        this.authService = authService;
        this.currentUser = currentUser;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/google")
    @Operation(summary = "Google OAuth2 login",
            description = "Authenticate with a Google ID token (preferred) and receive a JWT. "
                    + "Legacy user-info payloads are still accepted for backward compatibility.")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody Map<String, Object> request) {
        log.info("Google login request received");
        AuthResponse response = authService.googleLoginFromRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/success")
    @Operation(summary = "OAuth2 success callback",
            description = "Handle successful OAuth2 authentication via Spring Security's redirect flow.")
    public ResponseEntity<String> oauth2Success(@AuthenticationPrincipal OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        log.info("OAuth2 login successful for user: {}", email);
        User user = authService.getUserByEmail(email);
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return ResponseEntity.ok("Login successful! Token: " + token);
    }

    @GetMapping("/failure")
    @Operation(summary = "OAuth2 failure callback",
            description = "Handle failed OAuth2 authentication redirects.")
    public ResponseEntity<String> oauth2Failure() {
        log.warn("OAuth2 login failed");
        return ResponseEntity.badRequest().body("Login failed");
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user",
            description = "Returns the profile of the currently authenticated user.")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        Long userId = currentUser.getUserId();
        UserResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
