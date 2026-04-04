package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import com.kamyaabi.entity.Order;
import com.kamyaabi.event.OrderEventType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Orchestrates email notifications for order events.
 * Sends emails to both the customer and configured admin emails.
 */
@Slf4j
@Service
public class OrderEmailService {

    private final EmailServiceFactory emailServiceFactory;
    private final EmailTemplateEngine templateEngine;
    private final EmailProperties emailProperties;

    public OrderEmailService(EmailServiceFactory emailServiceFactory,
                             EmailTemplateEngine templateEngine,
                             EmailProperties emailProperties) {
        this.emailServiceFactory = emailServiceFactory;
        this.templateEngine = templateEngine;
        this.emailProperties = emailProperties;
    }

    @Async("emailTaskExecutor")
    public void sendOrderNotification(Order order, OrderEventType eventType) {
        if (!emailProperties.isEnabled()) {
            log.debug("Email notifications are disabled");
            return;
        }

        // No emails for ORDER_PLACED (payment not yet confirmed) or PAYMENT_PENDING
        if (eventType == OrderEventType.ORDER_PLACED || eventType == OrderEventType.PAYMENT_PENDING) {
            log.info("Skipping email for event: {} order: {} — awaiting payment confirmation", eventType, order.getId());
            return;
        }

        // Customer always gets notified for actionable events
        sendCustomerEmail(order, eventType);

        // Admin only gets notified on payment success (confirmed revenue)
        if (eventType == OrderEventType.PAYMENT_SUCCESS) {
            sendAdminEmails(order, eventType);
        } else {
            log.debug("Skipping admin email for event: {} order: {} — admin notified only on payment success", eventType, order.getId());
        }
    }

    private void sendCustomerEmail(Order order, OrderEventType eventType) {
        try {
            String to = order.getUser().getEmail();
            String subject = templateEngine.getSubject(eventType, order);
            String htmlContent = templateEngine.renderCustomerEmail(eventType, order);

            emailServiceFactory.getEmailService().sendEmail(to, subject, htmlContent);
            log.info("Customer email sent for event: {} order: {} to: {}", eventType, order.getId(), to);
        } catch (Exception e) {
            log.error("Failed to send customer email for event: {} order: {}", eventType, order.getId(), e);
        }
    }

    private void sendAdminEmails(Order order, OrderEventType eventType) {
        if (emailProperties.getAdminEmails().isEmpty()) {
            log.debug("No admin emails configured, skipping admin notification");
            return;
        }

        try {
            String subject = templateEngine.getAdminSubject(eventType, order);
            String htmlContent = templateEngine.renderAdminEmail(eventType, order);

            for (String adminEmail : emailProperties.getAdminEmails()) {
                try {
                    emailServiceFactory.getEmailService().sendEmail(adminEmail, subject, htmlContent);
                    log.info("Admin email sent for event: {} order: {} to: {}", eventType, order.getId(), adminEmail);
                } catch (Exception e) {
                    log.error("Failed to send admin email to: {} for event: {} order: {}", adminEmail, eventType, order.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to send admin emails for event: {} order: {}", eventType, order.getId(), e);
        }
    }
}
