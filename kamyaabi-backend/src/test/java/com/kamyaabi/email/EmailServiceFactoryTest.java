package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceFactoryTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void shouldCreateSendGridService_whenSendGridConfigured() {
        EmailProperties props = new EmailProperties();
        props.getSendgrid().setApiKey("SG.valid-api-key");

        EmailServiceFactory factory = new EmailServiceFactory(props, mailSender);

        assertThat(factory.getEmailService()).isInstanceOf(SendGridEmailService.class);
    }

    @Test
    void shouldCreateSmtpService_whenOnlySmtpConfigured() {
        EmailProperties props = new EmailProperties();
        props.getSendgrid().setApiKey("your-sendgrid-api-key"); // placeholder = not configured
        props.getSmtp().setHost("smtp.gmail.com");
        props.getSmtp().setUsername("user@gmail.com");
        props.getSmtp().setPassword("password");

        EmailServiceFactory factory = new EmailServiceFactory(props, mailSender);

        assertThat(factory.getEmailService()).isInstanceOf(SmtpEmailService.class);
    }

    @Test
    void shouldCreateNoOpService_whenNothingConfigured() {
        EmailProperties props = new EmailProperties();
        props.getSendgrid().setApiKey("your-sendgrid-api-key"); // placeholder
        props.getSmtp().setHost("smtp.gmail.com-placeholder"); // placeholder

        EmailServiceFactory factory = new EmailServiceFactory(props, mailSender);

        assertThat(factory.getEmailService()).isInstanceOf(EmailServiceFactory.NoOpEmailService.class);
    }

    @Test
    void shouldPreferSendGrid_whenBothConfigured() {
        EmailProperties props = new EmailProperties();
        props.getSendgrid().setApiKey("SG.valid-api-key");
        props.getSmtp().setHost("smtp.gmail.com");

        EmailServiceFactory factory = new EmailServiceFactory(props, mailSender);

        assertThat(factory.getEmailService()).isInstanceOf(SendGridEmailService.class);
    }

    @Test
    void noOpService_shouldLogWithoutError() {
        EmailServiceFactory.NoOpEmailService noOp = new EmailServiceFactory.NoOpEmailService();
        // Should not throw
        noOp.sendEmail("test@test.com", "Test Subject", "<p>Hello</p>");
    }

    @Test
    void getEmailService_withInjectedService_shouldReturnIt() {
        EmailService mockService = (to, subject, html) -> {};
        EmailServiceFactory factory = new EmailServiceFactory(mockService);

        assertThat(factory.getEmailService()).isSameAs(mockService);
    }
}
