package com.kamyaabi.config;

import com.kamyaabi.email.EmailServiceFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("email")
public class EmailProviderHealthIndicator implements HealthIndicator {

    private final EmailServiceFactory factory;

    public EmailProviderHealthIndicator(EmailServiceFactory factory) {
        this.factory = factory;
    }

    @Override
    public Health health() {
        String providerName = factory.getEmailService().getClass().getSimpleName();
        String providerLabel = switch (providerName) {
            case "SendGridEmailService" -> "sendgrid";
            case "SmtpEmailService" -> "smtp";
            case "NoOpEmailService" -> "none";
            default -> providerName;
        };
        return Health.up()
                .withDetail("provider", providerLabel)
                .build();
    }
}
