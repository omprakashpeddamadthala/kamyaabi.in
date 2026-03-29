package com.kamyaabi.event;

import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrderEventPublisherTest {

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private OrderEventPublisher orderEventPublisher;

    @Test
    void publishOrderEvent_shouldPublishCorrectEvent() {
        User user = User.builder().id(1L).email("test@test.com").name("Test").role(User.Role.USER).build();
        Order order = Order.builder()
                .id(1L).user(user).totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PENDING).items(new ArrayList<>())
                .build();

        orderEventPublisher.publishOrderEvent(order, OrderEventType.ORDER_PLACED);

        ArgumentCaptor<OrderEvent> captor = ArgumentCaptor.forClass(OrderEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());

        OrderEvent event = captor.getValue();
        assertThat(event.getOrder()).isSameAs(order);
        assertThat(event.getEventType()).isEqualTo(OrderEventType.ORDER_PLACED);
    }

    @Test
    void publishOrderEvent_allEventTypes_shouldPublish() {
        User user = User.builder().id(1L).email("test@test.com").name("Test").role(User.Role.USER).build();
        Order order = Order.builder()
                .id(1L).user(user).totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PENDING).items(new ArrayList<>())
                .build();

        for (OrderEventType eventType : OrderEventType.values()) {
            orderEventPublisher.publishOrderEvent(order, eventType);
        }

        verify(eventPublisher, org.mockito.Mockito.times(OrderEventType.values().length))
                .publishEvent(org.mockito.ArgumentMatchers.any(OrderEvent.class));
    }
}
