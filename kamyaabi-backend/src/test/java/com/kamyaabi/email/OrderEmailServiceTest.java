package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import com.kamyaabi.entity.*;
import com.kamyaabi.event.OrderEventType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderEmailServiceTest {

    @Mock
    private EmailServiceFactory emailServiceFactory;

    @Mock
    private EmailTemplateEngine templateEngine;

    @Mock
    private EmailService emailService;

    private EmailProperties emailProperties;
    private OrderEmailService orderEmailService;
    private Order order;

    @BeforeEach
    void setUp() {
        emailProperties = new EmailProperties();
        emailProperties.setEnabled(true);
        emailProperties.setAdminEmails(new ArrayList<>(List.of("admin@kamyaabi.in")));

        orderEmailService = new OrderEmailService(emailServiceFactory, templateEngine, emailProperties);

        User user = User.builder()
                .id(1L).email("customer@test.com").name("Test Customer").role(User.Role.USER)
                .build();

        order = Order.builder()
                .id(100L).user(user)
                .totalAmount(new BigDecimal("1498.00")).status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void sendOrderNotification_shouldSendCustomerAndAdminEmails() {
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("Order Confirmed");
        when(templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>Customer</p>");
        when(templateEngine.getAdminSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("[Admin] Order Confirmed");
        when(templateEngine.renderAdminEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>Admin</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_PLACED);

        verify(emailService).sendEmail("customer@test.com", "Order Confirmed", "<p>Customer</p>");
        verify(emailService).sendEmail("admin@kamyaabi.in", "[Admin] Order Confirmed", "<p>Admin</p>");
    }

    @Test
    void sendOrderNotification_emailDisabled_shouldNotSend() {
        emailProperties.setEnabled(false);

        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_PLACED);

        verifyNoInteractions(emailServiceFactory);
        verifyNoInteractions(templateEngine);
    }

    @Test
    void sendOrderNotification_noAdminEmails_shouldOnlySendCustomerEmail() {
        emailProperties.setAdminEmails(new ArrayList<>());
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("Order Confirmed");
        when(templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>Customer</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_PLACED);

        verify(emailService, times(1)).sendEmail(anyString(), anyString(), anyString());
        verify(emailService).sendEmail("customer@test.com", "Order Confirmed", "<p>Customer</p>");
    }

    @Test
    void sendOrderNotification_customerEmailFails_shouldStillSendAdminEmail() {
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("Order Confirmed");
        when(templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order)).thenThrow(new RuntimeException("Template error"));
        when(templateEngine.getAdminSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("[Admin] Order Confirmed");
        when(templateEngine.renderAdminEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>Admin</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_PLACED);

        verify(emailService).sendEmail("admin@kamyaabi.in", "[Admin] Order Confirmed", "<p>Admin</p>");
    }

    @Test
    void sendOrderNotification_multipleAdminEmails_shouldSendToAll() {
        emailProperties.setAdminEmails(new ArrayList<>(List.of("admin1@kamyaabi.in", "admin2@kamyaabi.in")));
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("Subject");
        when(templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>C</p>");
        when(templateEngine.getAdminSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("[Admin] Subject");
        when(templateEngine.renderAdminEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>A</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_PLACED);

        verify(emailService).sendEmail("admin1@kamyaabi.in", "[Admin] Subject", "<p>A</p>");
        verify(emailService).sendEmail("admin2@kamyaabi.in", "[Admin] Subject", "<p>A</p>");
    }

    @Test
    void sendOrderNotification_adminEmailFails_shouldNotBreak() {
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("Subject");
        when(templateEngine.renderCustomerEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>C</p>");
        when(templateEngine.getAdminSubject(OrderEventType.ORDER_PLACED, order)).thenReturn("[Admin] Subject");
        when(templateEngine.renderAdminEmail(OrderEventType.ORDER_PLACED, order)).thenReturn("<p>A</p>");
        doThrow(new RuntimeException("Send failed")).when(emailService)
                .sendEmail(eq("admin@kamyaabi.in"), anyString(), anyString());

        // Should not throw
        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_PLACED);

        verify(emailService).sendEmail(eq("customer@test.com"), anyString(), anyString());
    }
}
