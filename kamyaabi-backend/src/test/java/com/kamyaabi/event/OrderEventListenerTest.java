package com.kamyaabi.event;

import com.kamyaabi.email.OrderEmailService;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.User;
import com.kamyaabi.service.InvoiceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class OrderEventListenerTest {

    @Mock
    private OrderEmailService orderEmailService;

    @Mock
    private InvoiceService invoiceService;

    @InjectMocks
    private OrderEventListener orderEventListener;

    @Test
    void handleOrderEvent_paymentSuccess_shouldGenerateInvoiceAndDelegateToOrderEmailService() {
        User user = User.builder().id(1L).email("test@test.com").name("Test").role(User.Role.USER).build();
        Order order = Order.builder()
                .id(1L).user(user).totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PAID).items(new ArrayList<>())
                .build();

        OrderEvent event = new OrderEvent(this, order, OrderEventType.PAYMENT_SUCCESS);

        orderEventListener.handleOrderEvent(event);

        verify(invoiceService).generateInvoiceAfterPayment(order.getId());
        verify(orderEmailService).sendOrderNotification(order, OrderEventType.PAYMENT_SUCCESS);
    }

    @Test
    void handleOrderEvent_orderPlaced_shouldOnlyDelegateToOrderEmailService() {
        User user = User.builder().id(1L).email("test@test.com").name("Test").role(User.Role.USER).build();
        Order order = Order.builder()
                .id(1L).user(user).totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PENDING).items(new ArrayList<>())
                .build();

        OrderEvent event = new OrderEvent(this, order, OrderEventType.ORDER_PLACED);

        orderEventListener.handleOrderEvent(event);

        verify(invoiceService, never()).generateInvoiceAfterPayment(order.getId());
        verify(orderEmailService).sendOrderNotification(order, OrderEventType.ORDER_PLACED);
    }
}
