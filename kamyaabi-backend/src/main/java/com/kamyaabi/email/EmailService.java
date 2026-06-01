package com.kamyaabi.email;

import java.util.List;

public interface EmailService {

    void sendEmail(String to, String subject, String htmlContent);

    default void sendEmail(String to, String subject, String htmlContent, List<EmailAttachment> attachments) {
        sendEmail(to, subject, htmlContent);
    }
}
