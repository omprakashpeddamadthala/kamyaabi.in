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

    public AuthServiceImpl(UserRepository userRepository,
                           JwtTokenProvider jwtTokenProvider,
                           UserMapper userMapper) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
    }

    @Override
    public AuthResponse googleLogin(String idToken) {
        log.info("Processing Google login with ID token verification");
        
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    HTTP_TRANSPORT, JSON_FACTORY)
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            
            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                log.error("Invalid Google ID token");
                throw new UnauthorizedException("Invalid Google ID token");
            }
            
            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            
            // Extract user information from the verified token
            Map<String, Object> userInfo = Map.of(
                "email", payload.getEmail(),
                "name", payload.get("name"),
                "picture", payload.get("picture"),
                "sub", payload.getSubject()
            );
            
            log.info("Successfully verified Google ID token for user: {}", payload.getEmail());
            return processGoogleUser(userInfo);
            
        } catch (Exception e) {
            log.error("Failed to verify Google ID token", e);
            throw new UnauthorizedException("Failed to verify Google ID token: " + e.getMessage());
        }
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
