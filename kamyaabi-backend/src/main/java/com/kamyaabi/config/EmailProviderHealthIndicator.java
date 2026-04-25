package com.kamyaabi.config;

import com.kamyaabi.email.EmailServiceFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Custom actuator health indicator for the transactional email provider.
 *
 * <p>Reports:
 * <ul>
 *   <li>{@code UP} with the resolved provider name when an email service is configured.</li>
 *   <li>{@code UP} with {@code provider=none} when the NoOp fallback is active — the
 *       application is still functional, but admin/order notifications won't leave the box.</li>
 * </ul>
 *
 * <p>Registered under the name {@code email} so it appears as
 * {@code /actuator/health.components.email}.
 */
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
