package com.kamyaabi.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

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

    private String frontendUrl = "https://kamyaabi.in";

    @Getter
    @Setter
    public static class Jwt {
        @NotBlank
        private String secret;

        @Positive
        private long expirationMs;
    }

    @Getter
    @Setter
    public static class Cors {
        @NotBlank
        private String allowedOrigins;
    }

    @Getter
    @Setter
    public static class Razorpay {
        @NotBlank
        private String keyId;

        @NotBlank
        private String keySecret;
    }
}

