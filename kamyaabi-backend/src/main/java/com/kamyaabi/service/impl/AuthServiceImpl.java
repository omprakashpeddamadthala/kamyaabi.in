package com.kamyaabi.service.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.exception.UnauthorizedException;
import com.kamyaabi.mapper.UserMapper;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.security.JwtTokenProvider;
import com.kamyaabi.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;
    
    private static final NetHttpTransport HTTP_TRANSPORT = new NetHttpTransport();
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    
    // Reuse verifier instance to avoid cold-start delays in production
    private volatile GoogleIdTokenVerifier cachedVerifier;

    public AuthServiceImpl(UserRepository userRepository,
                           JwtTokenProvider jwtTokenProvider,
                           UserMapper userMapper) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
    }
    
    private GoogleIdTokenVerifier getVerifier() {
        if (cachedVerifier == null) {
            synchronized (this) {
                if (cachedVerifier == null) {
                    cachedVerifier = new GoogleIdTokenVerifier.Builder(
                            HTTP_TRANSPORT, JSON_FACTORY)
                            .setAudience(Collections.singletonList(googleClientId))
                            .build();
                    log.info("Initialized Google ID token verifier with client ID: {}...{}", 
                            googleClientId.substring(0, Math.min(8, googleClientId.length())),
                            googleClientId.length() > 8 ? googleClientId.substring(googleClientId.length() - 4) : "");
                }
            }
        }
        return cachedVerifier;
    }

    /**
     * Dispatches a Google login request based on the payload shape. Prefers the
     * modern ID-token flow; falls back to the legacy user-info map only when the
     * {@code idToken} key is absent/blank (logged as a deprecation warning).
     *
     * <p>This was previously handled by branching inside {@code AuthController};
     * centralising it here keeps controllers free of business logic.
     */
    @Override
    public AuthResponse googleLoginFromRequest(Map<String, Object> request) {
        String idToken = (String) request.get("idToken");
        if (idToken != null && !idToken.trim().isEmpty()) {
            return googleLogin(idToken);
        }
        log.warn("Using legacy Google login format (no idToken key). Clients should migrate to ID-token verification.");
        return processGoogleUser(request);
    }

    @Override
    public AuthResponse googleLogin(String idToken) {
        log.info("Processing Google login with ID token verification");
        
        // Retry logic to handle transient failures (e.g., Google cert fetch on cold start)
        int maxRetries = 2;
        Exception lastException = null;
        
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    log.info("Retrying Google ID token verification, attempt {}", attempt + 1);
                    Thread.sleep(500L * attempt);
                }
                
                GoogleIdToken googleIdToken = getVerifier().verify(idToken);
                if (googleIdToken == null) {
                    log.error("Invalid Google ID token (null result from verifier)");
                    throw new UnauthorizedException("Invalid Google ID token");
                }
                
                GoogleIdToken.Payload payload = googleIdToken.getPayload();
                
                String email = payload.getEmail();
                Object nameObj = payload.get("name");
                Object pictureObj = payload.get("picture");
                String sub = payload.getSubject();
                
                // Build user info map with null-safe values
                java.util.HashMap<String, Object> userInfo = new java.util.HashMap<>();
                userInfo.put("email", email);
                userInfo.put("name", nameObj != null ? nameObj : email);
                userInfo.put("picture", pictureObj != null ? pictureObj : "");
                userInfo.put("sub", sub);
                
                log.info("Successfully verified Google ID token for user: {}", email);
                return processGoogleUser(userInfo);
                
            } catch (UnauthorizedException e) {
                throw e;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new UnauthorizedException("Token verification interrupted");
            } catch (Exception e) {
                lastException = e;
                log.warn("Google ID token verification attempt {} failed: {}", attempt + 1, e.getMessage());
                // Invalidate cached verifier on failure so it gets rebuilt on retry
                cachedVerifier = null;
            }
        }
        
        log.error("Failed to verify Google ID token after {} attempts", maxRetries + 1, lastException);
        throw new UnauthorizedException("Failed to verify Google ID token: " + 
                (lastException != null ? lastException.getMessage() : "unknown error"));
    }

    @Override
    @Transactional
    public AuthResponse processGoogleUser(Map<String, Object> userInfo) {
        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String picture = (String) userInfo.get("picture");
        String googleId = (String) userInfo.get("sub");

        log.info("Processing Google user: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    log.info("Creating new user: {}", email);
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .avatarUrl(picture)
                            .googleId(googleId)
                            .role(User.Role.USER)
                            .build();
                    return userRepository.save(newUser);
                });

        // Update user info if changed
        if (name != null && !name.equals(user.getName())) {
            user.setName(name);
        }
        if (picture != null && !picture.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(picture);
        }
        if (googleId != null && !googleId.equals(user.getGoogleId())) {
            user.setGoogleId(googleId);
        }
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        log.debug("Fetching current user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        log.debug("Fetching user by email: {}", email);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
