package com.kamyaabi.event;

import com.kamyaabi.entity.Order;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Spring application event published when an order-related action occurs.
 */
@Getter
public class OrderEvent extends ApplicationEvent {

    private final Order order;
    private final OrderEventType eventType;

    public OrderEvent(Object source, Order order, OrderEventType eventType) {
        super(source);
        this.order = order;
        this.eventType = eventType;
    }
}
