package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.util.List;

@Slf4j
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;
    private final EmailProperties emailProperties;

    public SmtpEmailService(JavaMailSender mailSender, EmailProperties emailProperties) {
        this.mailSender = mailSender;
        this.emailProperties = emailProperties;
    }

    @Override
    public void sendEmail(String to, String subject, String htmlContent) {
        sendEmail(to, subject, htmlContent, List.of());
    }

    @Override
    public void sendEmail(String to, String subject, String htmlContent, List<EmailAttachment> attachments) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(emailProperties.getFromEmail(), emailProperties.getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            for (EmailAttachment attachment : attachments) {
                helper.addAttachment(attachment.filename(),
                        new org.springframework.core.io.ByteArrayResource(attachment.content()),
                        attachment.contentType());
            }

            mailSender.send(message);
            log.info("Email sent successfully via SMTP to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via SMTP to: {}", to, e);
        }
    }
}
