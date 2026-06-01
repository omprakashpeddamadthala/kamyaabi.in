package com.kamyaabi.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@ConfigurationProperties(prefix = "app.shiprocket")
@Getter
@Setter
public class ShiprocketProperties {

    private String apiToken = "";
    private String email = "";
    private String password = "";
    private long tokenRefreshIntervalSeconds = 9L * 24 * 60 * 60;
    private String pickupLocation = "home";
    private String channelId = "";
    private String webhookSecret = "";
    private double defaultWeight = 0.5;
    private int defaultLength = 10;
    private int defaultBreadth = 10;
    private int defaultHeight = 10;

    @PostConstruct
    void logConfigurationStatus() {
        if (isConfigured()) {
            if (hasLoginCredentials()) {
                log.info("Shiprocket configured via email/password credentials");
            } else {
                log.info("Shiprocket configured via static API token");
            }
        } else {
            log.warn("Shiprocket is NOT configured — set SHIPROCKET_EMAIL + SHIPROCKET_PASSWORD "
                    + "(or SHIPROCKET_API_TOKEN) in your environment. "
                    + "email present: {}, password present: {}, apiToken present: {}",
                    !sanitize(email).isEmpty(), !sanitize(password).isEmpty(), hasStaticToken());
        }
    }

    public boolean hasStaticToken() {
        return apiToken != null && !apiToken.isBlank();
    }

    public boolean hasLoginCredentials() {
        return email != null && !sanitize(email).isEmpty()
                && password != null && !sanitize(password).isEmpty();
    }

    public boolean isConfigured() {
        return hasStaticToken() || hasLoginCredentials();
    }

    /** Strip surrounding quotes and whitespace that may leak in from .env files. */
    public static String sanitize(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        if (trimmed.length() >= 2
                && ((trimmed.startsWith("\"") && trimmed.endsWith("\""))
                 || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }
}
