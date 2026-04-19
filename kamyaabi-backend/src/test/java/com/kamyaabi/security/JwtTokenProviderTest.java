package com.kamyaabi.security;

import com.kamyaabi.config.AppProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        AppProperties appProperties = new AppProperties();
        AppProperties.Jwt jwt = new AppProperties.Jwt();
        jwt.setSecret("test-secret-key-must-be-at-least-256-bits-long-for-hs256-algorithm");
        jwt.setExpirationMs(86400000L);
        appProperties.setJwt(jwt);

        jwtTokenProvider = new JwtTokenProvider(appProperties);
    }

    @Test
    void generateToken_shouldReturnValidToken() {
        String token = jwtTokenProvider.generateToken(1L, "test@kamyaabi.shop", "USER");

        assertThat(token).isNotNull().isNotEmpty();
    }

    @Test
    void getUserIdFromToken_shouldReturnUserId() {
        String token = jwtTokenProvider.generateToken(42L, "test@kamyaabi.shop", "USER");

        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        assertThat(userId).isEqualTo(42L);
    }

    @Test
    void validateToken_validToken_shouldReturnTrue() {
        String token = jwtTokenProvider.generateToken(1L, "test@kamyaabi.shop", "USER");

        boolean isValid = jwtTokenProvider.validateToken(token);

        assertThat(isValid).isTrue();
    }

    @Test
    void validateToken_invalidToken_shouldReturnFalse() {
        boolean isValid = jwtTokenProvider.validateToken("invalid-token");

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_emptyToken_shouldReturnFalse() {
        boolean isValid = jwtTokenProvider.validateToken("");

        assertThat(isValid).isFalse();
    }

    @Test
    void validateToken_expiredToken_shouldReturnFalse() {
        AppProperties appProperties = new AppProperties();
        AppProperties.Jwt jwt = new AppProperties.Jwt();
        jwt.setSecret("test-secret-key-must-be-at-least-256-bits-long-for-hs256-algorithm");
        jwt.setExpirationMs(0L);
        appProperties.setJwt(jwt);

        JwtTokenProvider expiredProvider = new JwtTokenProvider(appProperties);
        String token = expiredProvider.generateToken(1L, "test@kamyaabi.shop", "USER");

        boolean isValid = expiredProvider.validateToken(token);

        assertThat(isValid).isFalse();
    }

    @Test
    void generateToken_withAdminRole_shouldReturnValidToken() {
        String token = jwtTokenProvider.generateToken(1L, "admin@kamyaabi.shop", "ADMIN");

        assertThat(token).isNotNull();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserIdFromToken(token)).isEqualTo(1L);
    }
}
