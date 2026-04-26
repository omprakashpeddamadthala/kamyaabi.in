package com.kamyaabi.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Strongly-typed binding for the {@code app.*} configuration block.
 * Values are validated at startup via {@link Validated} so a misconfigured
 * deployment fails fast instead of at the first authenticated request.
 */
@Configuration
@ConfigurationProperties(prefix = "app")
@Validated
@Getter
@Setter
public class AppProperties {

    @Valid
    private Jwt jwt = new Jwt();

    @Valid
    private Cors cors = new Cors();

    @Valid
    private Razorpay razorpay = new Razorpay();

    @Getter
    @Setter
    public static class Jwt {
        /** HMAC-SHA256 secret for signing JWTs; must be at least 32 bytes. */
        @NotBlank
        private String secret;

        /** JWT lifetime in milliseconds. */
        @Positive
        private long expirationMs;
    }

    @Getter
    @Setter
    public static class Cors {
        /** Comma-separated list of CORS-allowed origins consumed by CorsConfig. */
        @NotBlank
        private String allowedOrigins;
    }

    @Getter
    @Setter
    public static class Razorpay {
        /** Razorpay public key id; safe to ship to the frontend. */
        @NotBlank
        private String keyId;

        /** Razorpay secret key; never log or expose via APIs. */
        @NotBlank
        private String keySecret;
    }
}

