package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import com.kamyaabi.entity.Order;
import com.kamyaabi.event.OrderEventType;
import com.kamyaabi.invoice.InvoiceDocument;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.InvoiceService;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class OrderEmailService {

    private final EmailServiceFactory emailServiceFactory;
    private final EmailTemplateEngine templateEngine;
    private final EmailProperties emailProperties;
    private final OrderRepository orderRepository;
    private final AdminEmailResolver adminEmailResolver;
    private final InvoiceService invoiceService;

    public OrderEmailService(EmailServiceFactory emailServiceFactory,
                             EmailTemplateEngine templateEngine,
                             EmailProperties emailProperties,
                             OrderRepository orderRepository,
                             AdminEmailResolver adminEmailResolver,
                             InvoiceService invoiceService) {
        this.emailServiceFactory = emailServiceFactory;
        this.templateEngine = templateEngine;
        this.emailProperties = emailProperties;
        this.orderRepository = orderRepository;
        this.adminEmailResolver = adminEmailResolver;
        this.invoiceService = invoiceService;
    }

    @Async("emailTaskExecutor")
    @Transactional(readOnly = true)
    public void sendOrderNotification(Order order, OrderEventType eventType) {
        if (!emailProperties.isEnabled()) {
            log.debug("Email notifications are disabled");
            return;
        }

        if (eventType == OrderEventType.ORDER_PLACED || eventType == OrderEventType.PAYMENT_PENDING) {
            log.info("Skipping email for event: {} order: {} — awaiting payment confirmation", eventType, order.getId());
            return;
        }

        Order freshOrder = orderRepository.findByIdWithUser(order.getId())
                .orElse(null);
        if (freshOrder == null) {
            log.error("Order {} not found when sending email for event: {}", order.getId(), eventType);
            return;
        }

        sendCustomerEmail(freshOrder, eventType);

        if (eventType == OrderEventType.PAYMENT_SUCCESS
                || eventType == OrderEventType.COD_ORDER_PLACED) {
            sendAdminEmails(freshOrder, eventType);
        } else {
            log.debug("Skipping admin email for event: {} order: {} — admin notified only on payment success / COD order", eventType, order.getId());
        }
    }

    private void sendCustomerEmail(Order order, OrderEventType eventType) {
        try {
            String to = order.getUser().getEmail();
            String subject = templateEngine.getSubject(eventType, order);
            String htmlContent = templateEngine.renderCustomerEmail(eventType, order);

            if (eventType == OrderEventType.PAYMENT_SUCCESS || eventType == OrderEventType.COD_ORDER_PLACED) {
                InvoiceDocument invoice = invoiceService.generateInvoice(order.getId());
                emailServiceFactory.getEmailService().sendEmail(to, subject, htmlContent, List.of(
                        new EmailAttachment(invoice.filename(), "application/pdf", invoice.content())));
            } else {
                emailServiceFactory.getEmailService().sendEmail(to, subject, htmlContent);
            }
            log.info("Customer email sent for event: {} order: {} to: {}", eventType, order.getId(), to);
        } catch (Exception e) {
            log.error("Failed to send customer email for event: {} order: {}", eventType, order.getId(), e);
        }
    }

    private void sendAdminEmails(Order order, OrderEventType eventType) {
        java.util.List<String> adminEmails = adminEmailResolver.getAdminEmails();
        if (adminEmails.isEmpty()) {
            log.warn("No active admin users found in database — skipping admin notification "
                    + "for event: {} order: {}", eventType, order.getId());
            return;
        }

        try {
            String subject = templateEngine.getAdminSubject(eventType, order);
            String htmlContent = templateEngine.renderAdminEmail(eventType, order);

            for (String adminEmail : adminEmails) {
                try {
                    emailServiceFactory.getEmailService().sendEmail(adminEmail, subject, htmlContent);
                    log.info("Admin email sent for event: {} order: {} to: {}", eventType, order.getId(), adminEmail);
                } catch (Exception e) {
                    log.error("Failed to send admin email to: {} for event: {} order: {}",
                            adminEmail, eventType, order.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to send admin emails for event: {} order: {}", eventType, order.getId(), e);
        }
    }
}
