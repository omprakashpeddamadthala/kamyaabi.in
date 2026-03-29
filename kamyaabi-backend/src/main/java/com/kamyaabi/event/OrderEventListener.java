package com.kamyaabi.event;

import com.kamyaabi.email.OrderEmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.stereotype.Component;

/**
 * Listens for OrderEvent and delegates to OrderEmailService for email notifications.
 * Uses @TransactionalEventListener to process events after the transaction commits,
 * ensuring order status updates succeed even if email notification fails.
 */
@Slf4j
@Component
public class OrderEventListener {

    private final OrderEmailService orderEmailService;

    public OrderEventListener(OrderEmailService orderEmailService) {
        this.orderEmailService = orderEmailService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderEvent(OrderEvent event) {
        try {
            log.info("Received order event: {} for order: {}", event.getEventType(), event.getOrder().getId());
            orderEmailService.sendOrderNotification(event.getOrder(), event.getEventType());
        } catch (Exception e) {
            log.error("Failed to process order event for order: {}", event.getOrder().getId(), e);
        }
    }
}
