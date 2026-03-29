package com.kamyaabi.event;

import com.kamyaabi.email.OrderEmailService;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrderEventListenerTest {

    @Mock
    private OrderEmailService orderEmailService;

    @InjectMocks
    private OrderEventListener orderEventListener;

    @Test
    void handleOrderEvent_shouldDelegateToOrderEmailService() {
        User user = User.builder().id(1L).email("test@test.com").name("Test").role(User.Role.USER).build();
        Order order = Order.builder()
                .id(1L).user(user).totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PENDING).items(new ArrayList<>())
                .build();

        OrderEvent event = new OrderEvent(this, order, OrderEventType.ORDER_PLACED);

        orderEventListener.handleOrderEvent(event);

        verify(orderEmailService).sendOrderNotification(order, OrderEventType.ORDER_PLACED);
    }

    @Test
    void handleOrderEvent_allEventTypes_shouldDelegate() {
        User user = User.builder().id(1L).email("test@test.com").name("Test").role(User.Role.USER).build();
        Order order = Order.builder()
                .id(1L).user(user).totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PENDING).items(new ArrayList<>())
                .build();

        for (OrderEventType eventType : OrderEventType.values()) {
            OrderEvent event = new OrderEvent(this, order, eventType);
            orderEventListener.handleOrderEvent(event);
            verify(orderEmailService).sendOrderNotification(order, eventType);
        }
    }
}
