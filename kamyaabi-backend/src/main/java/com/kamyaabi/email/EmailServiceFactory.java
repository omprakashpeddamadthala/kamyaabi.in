package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Factory that selects the appropriate EmailService implementation based on configuration.
 * Strategy: If SendGrid API key is configured, use SendGrid; otherwise fallback to SMTP.
 */
@Slf4j
@Component
public class EmailServiceFactory {

    private final EmailService emailService;

    // @Autowired is kept on this constructor to disambiguate from the package-private
    // test constructor below; without it Spring sees two constructors on the bean and
    // can't decide which one to use.
    @Autowired
    public EmailServiceFactory(EmailProperties emailProperties, JavaMailSender mailSender) {
        if (emailProperties.isSendGridConfigured()) {
            log.info("Email provider: SendGrid");
            this.emailService = new SendGridEmailService(emailProperties);
        } else if (emailProperties.isSmtpConfigured()) {
            log.info("Email provider: SMTP");
            this.emailService = new SmtpEmailService(mailSender, emailProperties);
        } else {
            log.warn("No email provider configured. Email notifications will be logged only.");
            this.emailService = new NoOpEmailService();
        }
    }

    // Visible for testing
    EmailServiceFactory(EmailService emailService) {
        this.emailService = emailService;
    }

    public EmailService getEmailService() {
        return emailService;
    }

    /**
     * No-op implementation used when no email provider is configured.
     */
    static class NoOpEmailService implements EmailService {
        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NoOpEmailService.class);

        @Override
        public void sendEmail(String to, String subject, String htmlContent) {
            log.info("Email notification (no provider configured) - To: {}, Subject: {}", to, subject);
        }
    }
}
