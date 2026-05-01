package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EmailServiceFactory {

    private final EmailService emailService;

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

    EmailServiceFactory(EmailService emailService) {
        this.emailService = emailService;
    }

    public EmailService getEmailService() {
        return emailService;
    }

    static class NoOpEmailService implements EmailService {
        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NoOpEmailService.class);

        @Override
        public void sendEmail(String to, String subject, String htmlContent) {
            log.info("Email notification (no provider configured) - To: {}, Subject: {}", to, subject);
        }
    }
}
