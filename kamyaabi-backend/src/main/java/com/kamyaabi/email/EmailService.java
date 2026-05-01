package com.kamyaabi.email;

public interface EmailService {

    void sendEmail(String to, String subject, String htmlContent);
}
