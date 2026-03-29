package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

/**
 * Email service implementation using SendGrid API.
 */
@Slf4j
public class SendGridEmailService implements EmailService {

    private final SendGrid sendGrid;
    private final EmailProperties emailProperties;

    public SendGridEmailService(EmailProperties emailProperties) {
        this.emailProperties = emailProperties;
        this.sendGrid = new SendGrid(emailProperties.getSendgrid().getApiKey());
    }

    // Visible for testing
    SendGridEmailService(SendGrid sendGrid, EmailProperties emailProperties) {
        this.sendGrid = sendGrid;
        this.emailProperties = emailProperties;
    }

    @Override
    public void sendEmail(String to, String subject, String htmlContent) {
        Email from = new Email(emailProperties.getFromEmail(), emailProperties.getFromName());
        Email toEmail = new Email(to);
        Content content = new Content("text/html", htmlContent);
        Mail mail = new Mail(from, subject, toEmail, content);

        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sendGrid.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully via SendGrid to: {}", to);
            } else {
                log.error("SendGrid email failed with status: {} body: {}", response.getStatusCode(), response.getBody());
            }
        } catch (IOException e) {
            log.error("Failed to send email via SendGrid to: {}", to, e);
        }
    }
}
