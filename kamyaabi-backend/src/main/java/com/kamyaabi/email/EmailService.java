package com.kamyaabi.email;

/**
 * Interface for email sending abstraction.
 * Implementations provide different email providers (SendGrid, SMTP).
 */
public interface EmailService {

    /**
     * Send an email with HTML content.
     *
     * @param to          recipient email address
     * @param subject     email subject
     * @param htmlContent HTML body of the email
     */
    void sendEmail(String to, String subject, String htmlContent);
}
