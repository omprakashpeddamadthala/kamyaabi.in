package com.kamyaabi.event;

import com.kamyaabi.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OrderEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public OrderEventPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void publishOrderEvent(Order order, OrderEventType eventType) {
        log.info("Publishing order event: {} for order: {}", eventType, order.getId());
        OrderEvent event = new OrderEvent(this, order, eventType);
        eventPublisher.publishEvent(event);
    }
}
