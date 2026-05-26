package com.kamyaabi.event;

import com.kamyaabi.entity.Order;
import com.kamyaabi.service.ShiprocketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Slf4j
@Component
public class ShiprocketEventListener {

    private final ShiprocketService shiprocketService;

    public ShiprocketEventListener(ShiprocketService shiprocketService) {
        this.shiprocketService = shiprocketService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderEvent(OrderEvent event) {
        if (event.getEventType() != OrderEventType.PAYMENT_SUCCESS) {
            return;
        }

        Order order = event.getOrder();
        log.info("Payment success for order {} — triggering Shiprocket sync", order.getId());

        try {
            shiprocketService.syncOrderToShiprocket(order);
        } catch (Exception e) {
            log.error("Shiprocket sync failed for order {} after payment success — will retry later: {}",
                    order.getId(), e.getMessage(), e);
        }
    }
}
