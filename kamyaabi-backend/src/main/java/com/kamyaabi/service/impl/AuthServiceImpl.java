package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.UserMapper;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.security.JwtTokenProvider;
import com.kamyaabi.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;

    public AuthServiceImpl(UserRepository userRepository,
                           JwtTokenProvider jwtTokenProvider,
                           UserMapper userMapper) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
    }

    @Override
    public AuthResponse googleLogin(String idToken) {
        log.info("Processing Google login");

        // In a production environment, you would verify the Google ID token
        // using Google's tokeninfo endpoint or the Google Auth Library.
        // For now, we accept the token payload directly from the frontend
        // (which has already verified it with Google's OAuth2 flow).
        // The frontend sends user info extracted from the Google credential.

        // This is a simplified version - the frontend will send user details
        // after Google OAuth verification
        throw new BadRequestException("Use /api/auth/google/callback for Google login");
    }

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
}
