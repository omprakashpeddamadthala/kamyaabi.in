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
    private String pickupLocation = "Primary Warehouse";
    private String channelId = "";
    private String webhookSecret = "";
    private double defaultWeight = 0.5;
    private int defaultLength = 10;
    private int defaultBreadth = 10;
    private int defaultHeight = 10;

    /**
     * After Spring binds properties from YAML / env, fall back to raw OS
     * environment variables when the resolved values are empty.  This handles
     * the case where Docker Compose variable substitution fails (e.g. the
     * compose file on the server wasn't updated, or the .env file has
     * duplicate entries that override earlier values with blanks).
     */
    @PostConstruct
    void init() {
        email    = resolve(email,    "SHIPROCKET_EMAIL");
        password = resolve(password, "SHIPROCKET_PASSWORD");
        apiToken = resolve(apiToken, "SHIPROCKET_API_TOKEN");

        if (isConfigured()) {
            if (hasLoginCredentials()) {
                log.info("Shiprocket configured via email/password credentials");
            } else {
                log.info("Shiprocket configured via static API token");
            }
        } else {
            String envEmail = System.getenv("SHIPROCKET_EMAIL");
            String envPass  = System.getenv("SHIPROCKET_PASSWORD");
            String envToken = System.getenv("SHIPROCKET_API_TOKEN");
            log.warn("Shiprocket is NOT configured — set SHIPROCKET_EMAIL + "
                    + "SHIPROCKET_PASSWORD (or SHIPROCKET_API_TOKEN) in your "
                    + "environment.  Diagnostic: "
                    + "spring email='{}', spring password present={}, "
                    + "env SHIPROCKET_EMAIL={}, env SHIPROCKET_PASSWORD={}",
                    sanitize(email).isEmpty() ? "(empty)" : "(set)",
                    !sanitize(password).isEmpty(),
                    envEmail == null ? "null"
                            : envEmail.isBlank() ? "blank" : "set",
                    envPass == null ? "null"
                            : envPass.isBlank() ? "blank" : "set");
            if (envToken != null) {
                log.warn("  env SHIPROCKET_API_TOKEN={}", envToken.isBlank() ? "blank" : "set");
            }
        }
    }

    /**
     * Return the sanitized Spring-bound value if non-empty, otherwise fall
     * back to the raw OS environment variable.
     */
    private static String resolve(String springValue, String envVarName) {
        String v = sanitize(springValue);
        if (!v.isEmpty()) {
            return v;
        }
        String raw = System.getenv(envVarName);
        if (raw != null) {
            String s = sanitize(raw);
            if (!s.isEmpty()) {
                log.info("Shiprocket: resolved {} from OS environment (Spring "
                        + "property was empty)", envVarName);
                return s;
            }
        }
        return "";
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

    /**
     * Strip surrounding quotes, carriage returns, and whitespace that may
     * leak in from .env files or Windows-style line endings.
     */
    public static String sanitize(String value) {
        if (value == null) return "";
        String trimmed = value.replace("\r", "").trim();
        if (trimmed.length() >= 2
                && ((trimmed.startsWith("\"") && trimmed.endsWith("\""))
                 || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }
}
