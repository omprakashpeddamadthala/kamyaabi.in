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
        boolean shouldSync = event.getEventType() == OrderEventType.PAYMENT_SUCCESS
                || (event.getEventType() == OrderEventType.ORDER_CONFIRMED
                    && event.getOrder().getPaymentMethod() == Order.PaymentMethod.COD);

        if (!shouldSync) {
            return;
        }

        Order order = event.getOrder();
        log.info("{} for order {} — triggering Shiprocket sync", event.getEventType(), order.getId());

        try {
            shiprocketService.syncOrderToShiprocket(order);
        } catch (Exception e) {
            log.error("Shiprocket sync failed for order {} after payment success — will retry later: {}",
                    order.getId(), e.getMessage(), e);
        }
    }
}
