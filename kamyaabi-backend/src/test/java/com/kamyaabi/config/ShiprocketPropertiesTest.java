package com.kamyaabi.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ShiprocketPropertiesTest {

    @Test
    void isConfigured_tokenSet_returnsTrue() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken("some-api-token");
        assertThat(props.isConfigured()).isTrue();
    }

    @Test
    void isConfigured_tokenNull_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken(null);
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_tokenBlank_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken("  ");
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_tokenEmpty_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken("");
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void defaults_areSet() {
        ShiprocketProperties props = new ShiprocketProperties();
        assertThat(props.getPickupLocation()).isEqualTo("home");
        assertThat(props.getDefaultWeight()).isEqualTo(0.5);
        assertThat(props.getDefaultLength()).isEqualTo(10);
        assertThat(props.getDefaultBreadth()).isEqualTo(10);
        assertThat(props.getDefaultHeight()).isEqualTo(10);
        assertThat(props.getTokenRefreshIntervalSeconds()).isEqualTo(9L * 24 * 60 * 60);
    }

    @Test
    void isConfigured_loginCredentialsSet_returnsTrue() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail("merchant@example.com");
        props.setPassword("secret");
        assertThat(props.isConfigured()).isTrue();
        assertThat(props.hasLoginCredentials()).isTrue();
        assertThat(props.hasStaticToken()).isFalse();
    }

    @Test
    void hasLoginCredentials_emailMissing_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setPassword("secret");
        assertThat(props.hasLoginCredentials()).isFalse();
    }

    @Test
    void hasLoginCredentials_passwordMissing_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail("merchant@example.com");
        assertThat(props.hasLoginCredentials()).isFalse();
    }

    @Test
    void sanitize_stripsQuotesAndWhitespace() {
        assertThat(ShiprocketProperties.sanitize("  \"user@test.com\"  ")).isEqualTo("user@test.com");
        assertThat(ShiprocketProperties.sanitize("'password123'")).isEqualTo("password123");
        assertThat(ShiprocketProperties.sanitize("  plain  ")).isEqualTo("plain");
        assertThat(ShiprocketProperties.sanitize(null)).isEmpty();
        assertThat(ShiprocketProperties.sanitize("")).isEmpty();
        assertThat(ShiprocketProperties.sanitize("  ")).isEmpty();
    }

    @Test
    void hasLoginCredentials_quotedValues_returnsTrue() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail("  \"merchant@example.com\"");
        props.setPassword("  \"secret\"  ");
        assertThat(props.hasLoginCredentials()).isTrue();
    }
}
