package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import com.kamyaabi.entity.*;
import com.kamyaabi.event.OrderEventType;
import com.kamyaabi.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    @Mock
    private OrderRepository orderRepository;

    private EmailProperties emailProperties;
    private OrderEmailService orderEmailService;
    private Order order;

    @BeforeEach
    void setUp() {
        emailProperties = new EmailProperties();
        emailProperties.setEnabled(true);
        emailProperties.setAdminEmails(new ArrayList<>(List.of("admin@kamyaabi.in")));

        orderEmailService = new OrderEmailService(emailServiceFactory, templateEngine, emailProperties, orderRepository);

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
    void sendOrderNotification_paymentSuccess_shouldSendCustomerAndAdminEmails() {
        when(orderRepository.findByIdWithUser(order.getId())).thenReturn(Optional.of(order));
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("Payment Confirmed");
        when(templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>Customer</p>");
        when(templateEngine.getAdminSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("[Admin] Payment Confirmed");
        when(templateEngine.renderAdminEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>Admin</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.PAYMENT_SUCCESS);

        verify(emailService).sendEmail("customer@test.com", "Payment Confirmed", "<p>Customer</p>");
        verify(emailService).sendEmail("admin@kamyaabi.in", "[Admin] Payment Confirmed", "<p>Admin</p>");
    }

    @Test
    void sendOrderNotification_emailDisabled_shouldNotSend() {
        emailProperties.setEnabled(false);

        orderEmailService.sendOrderNotification(order, OrderEventType.PAYMENT_SUCCESS);

        verifyNoInteractions(emailServiceFactory);
        verifyNoInteractions(templateEngine);
    }

    @Test
    void sendOrderNotification_orderPlaced_shouldSkipEmails() {
        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_PLACED);

        verifyNoInteractions(emailServiceFactory);
        verifyNoInteractions(templateEngine);
    }

    @Test
    void sendOrderNotification_noAdminEmails_shouldOnlySendCustomerEmail() {
        emailProperties.setAdminEmails(new ArrayList<>());
        when(orderRepository.findByIdWithUser(order.getId())).thenReturn(Optional.of(order));
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("Payment Confirmed");
        when(templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>Customer</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.PAYMENT_SUCCESS);

        verify(emailService, times(1)).sendEmail(anyString(), anyString(), anyString());
        verify(emailService).sendEmail("customer@test.com", "Payment Confirmed", "<p>Customer</p>");
    }

    @Test
    void sendOrderNotification_customerEmailFails_shouldStillSendAdminEmail() {
        when(orderRepository.findByIdWithUser(order.getId())).thenReturn(Optional.of(order));
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("Payment Confirmed");
        when(templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenThrow(new RuntimeException("Template error"));
        when(templateEngine.getAdminSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("[Admin] Payment Confirmed");
        when(templateEngine.renderAdminEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>Admin</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.PAYMENT_SUCCESS);

        verify(emailService).sendEmail("admin@kamyaabi.in", "[Admin] Payment Confirmed", "<p>Admin</p>");
    }

    @Test
    void sendOrderNotification_multipleAdminEmails_shouldSendToAll() {
        emailProperties.setAdminEmails(new ArrayList<>(List.of("admin1@kamyaabi.in", "admin2@kamyaabi.in")));
        when(orderRepository.findByIdWithUser(order.getId())).thenReturn(Optional.of(order));
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("Subject");
        when(templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>C</p>");
        when(templateEngine.getAdminSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("[Admin] Subject");
        when(templateEngine.renderAdminEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>A</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.PAYMENT_SUCCESS);

        verify(emailService).sendEmail("admin1@kamyaabi.in", "[Admin] Subject", "<p>A</p>");
        verify(emailService).sendEmail("admin2@kamyaabi.in", "[Admin] Subject", "<p>A</p>");
    }

    @Test
    void sendOrderNotification_adminEmailFails_shouldNotBreak() {
        when(orderRepository.findByIdWithUser(order.getId())).thenReturn(Optional.of(order));
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("Subject");
        when(templateEngine.renderCustomerEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>C</p>");
        when(templateEngine.getAdminSubject(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("[Admin] Subject");
        when(templateEngine.renderAdminEmail(OrderEventType.PAYMENT_SUCCESS, order)).thenReturn("<p>A</p>");
        doThrow(new RuntimeException("Send failed")).when(emailService)
                .sendEmail(eq("admin@kamyaabi.in"), anyString(), anyString());

        orderEmailService.sendOrderNotification(order, OrderEventType.PAYMENT_SUCCESS);

        verify(emailService).sendEmail(eq("customer@test.com"), anyString(), anyString());
    }

    @Test
    void sendOrderNotification_nonPaymentEvent_shouldOnlySendCustomerEmail() {
        when(orderRepository.findByIdWithUser(order.getId())).thenReturn(Optional.of(order));
        when(emailServiceFactory.getEmailService()).thenReturn(emailService);
        when(templateEngine.getSubject(OrderEventType.ORDER_CONFIRMED, order)).thenReturn("Order Confirmed");
        when(templateEngine.renderCustomerEmail(OrderEventType.ORDER_CONFIRMED, order)).thenReturn("<p>Confirmed</p>");

        orderEmailService.sendOrderNotification(order, OrderEventType.ORDER_CONFIRMED);

        verify(emailService, times(1)).sendEmail(anyString(), anyString(), anyString());
        verify(emailService).sendEmail("customer@test.com", "Order Confirmed", "<p>Confirmed</p>");
    }
}
