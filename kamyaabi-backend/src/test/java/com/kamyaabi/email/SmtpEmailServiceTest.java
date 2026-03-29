package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmtpEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    private EmailProperties emailProperties;
    private SmtpEmailService smtpEmailService;

    @BeforeEach
    void setUp() {
        emailProperties = new EmailProperties();
        emailProperties.setFromEmail("noreply@kamyaabi.in");
        emailProperties.setFromName("Kamyaabi");

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        smtpEmailService = new SmtpEmailService(mailSender, emailProperties);
    }

    @Test
    void sendEmail_shouldSendViaMimeMessage() {
        smtpEmailService.sendEmail("user@test.com", "Test Subject", "<p>Hello</p>");

        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendEmail_mailSenderThrows_shouldNotPropagate() {
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        // Should not throw - fails gracefully
        smtpEmailService.sendEmail("user@test.com", "Test Subject", "<p>Hello</p>");

        verify(mailSender).send(any(MimeMessage.class));
    }
}
