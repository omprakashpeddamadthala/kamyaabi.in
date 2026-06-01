package com.kamyaabi.event;

import com.kamyaabi.email.OrderEmailService;
import com.kamyaabi.service.InvoiceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OrderEventListener {

    private final OrderEmailService orderEmailService;
    private final InvoiceService invoiceService;

    public OrderEventListener(OrderEmailService orderEmailService, InvoiceService invoiceService) {
        this.orderEmailService = orderEmailService;
        this.invoiceService = invoiceService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderEvent(OrderEvent event) {
        try {
            log.info("Received order event: {} for order: {}", event.getEventType(), event.getOrder().getId());
            if (event.getEventType() == OrderEventType.PAYMENT_SUCCESS
                    || event.getEventType() == OrderEventType.COD_ORDER_PLACED) {
                invoiceService.generateInvoiceAfterPayment(event.getOrder().getId());
            }
            orderEmailService.sendOrderNotification(event.getOrder(), event.getEventType());
        } catch (Exception e) {
            log.error("Failed to process order event for order: {}", event.getOrder().getId(), e);
        }
    }
}
