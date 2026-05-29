package com.kamyaabi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

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

    public boolean hasStaticToken() {
        return apiToken != null && !apiToken.isBlank();
    }

    public boolean hasLoginCredentials() {
        return email != null && !email.isBlank()
                && password != null && !password.isBlank();
    }

    public boolean isConfigured() {
        return hasStaticToken() || hasLoginCredentials();
    }
}
