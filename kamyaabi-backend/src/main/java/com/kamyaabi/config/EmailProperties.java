package com.kamyaabi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "app.email")
@Getter
@Setter
public class EmailProperties {

    private boolean enabled = true;
    private String fromEmail = "omprakashornold@gmail.com";
    private String fromName = "Kamyaabi";
    private List<String> adminEmails = new ArrayList<>();
    private List<String> developerEmails = new ArrayList<>();

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

    public boolean isSendGridConfigured() {
        return sendgrid.getApiKey() != null
                && !sendgrid.getApiKey().isBlank()
                && !sendgrid.getApiKey().equals("your-sendgrid-api-key");
    }

    public boolean isSmtpConfigured() {
        return smtp.getHost() != null
                && !smtp.getHost().isBlank()
                && !smtp.getHost().equals("smtp.gmail.com-placeholder");
    }
}
