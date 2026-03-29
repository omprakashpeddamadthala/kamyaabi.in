package com.kamyaabi.event;

import com.kamyaabi.email.OrderEmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Listens for OrderEvent and delegates to OrderEmailService for email notifications.
 */
@Slf4j
@Component
public class OrderEventListener {

    private final OrderEmailService orderEmailService;

    public OrderEventListener(OrderEmailService orderEmailService) {
        this.orderEmailService = orderEmailService;
    }

    @EventListener
    public void handleOrderEvent(OrderEvent event) {
        log.info("Received order event: {} for order: {}", event.getEventType(), event.getOrder().getId());
        orderEmailService.sendOrderNotification(event.getOrder(), event.getEventType());
    }
}
