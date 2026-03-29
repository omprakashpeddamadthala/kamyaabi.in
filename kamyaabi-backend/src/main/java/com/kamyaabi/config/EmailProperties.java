package com.kamyaabi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration properties for email notification system.
 * Supports both SendGrid and SMTP providers with automatic fallback.
 */
@Configuration
@ConfigurationProperties(prefix = "app.email")
@Getter
@Setter
public class EmailProperties {

    private boolean enabled = true;
    private String fromEmail = "noreply@kamyaabi.in";
    private String fromName = "Kamyaabi";
    private List<String> adminEmails = new ArrayList<>();

    private SendGrid sendgrid = new SendGrid();
    private Smtp smtp = new Smtp();

    @Getter
    @Setter
    public static class SendGrid {
        private String apiKey;
    }

    @Getter
    @Setter
    public static class Smtp {
        private String host;
        private int port = 587;
        private String username;
        private String password;
        private boolean starttlsEnabled = true;
        private boolean auth = true;
    }

    /**
     * Determines if SendGrid is configured and should be used.
     */
    public boolean isSendGridConfigured() {
        return sendgrid.getApiKey() != null
                && !sendgrid.getApiKey().isBlank()
                && !sendgrid.getApiKey().equals("your-sendgrid-api-key");
    }

    /**
     * Determines if SMTP is configured and should be used as fallback.
     */
    public boolean isSmtpConfigured() {
        return smtp.getHost() != null
                && !smtp.getHost().isBlank()
                && !smtp.getHost().equals("smtp.gmail.com-placeholder");
    }
}
