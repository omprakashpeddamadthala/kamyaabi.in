package com.kamyaabi.event;

import com.kamyaabi.entity.Order;
import com.kamyaabi.service.ShiprocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiprocketEventListenerTest {

    @Mock private ShiprocketService shiprocketService;

    private ShiprocketEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new ShiprocketEventListener(shiprocketService);
    }

    @Test
    void handleOrderEvent_paymentSuccess_triggersSync() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PAID)
                .items(new ArrayList<>())
                .build();

        OrderEvent event = new OrderEvent(this, order, OrderEventType.PAYMENT_SUCCESS);
        listener.handleOrderEvent(event);

        verify(shiprocketService).syncOrderToShiprocket(order);
    }

    @Test
    void handleOrderEvent_orderPlaced_doesNotTriggerSync() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PENDING)
                .items(new ArrayList<>())
                .build();

        OrderEvent event = new OrderEvent(this, order, OrderEventType.ORDER_PLACED);
        listener.handleOrderEvent(event);

        verifyNoInteractions(shiprocketService);
    }

    @Test
    void handleOrderEvent_orderConfirmed_doesNotTriggerSync() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.CONFIRMED)
                .items(new ArrayList<>())
                .build();

        OrderEvent event = new OrderEvent(this, order, OrderEventType.ORDER_CONFIRMED);
        listener.handleOrderEvent(event);

        verifyNoInteractions(shiprocketService);
    }

    @Test
    void handleOrderEvent_codOrderPlaced_triggersSync() {
        Order order = Order.builder().id(7L)
                .totalAmount(new BigDecimal("249.00"))
                .status(Order.OrderStatus.CONFIRMED)
                .paymentMethod(Order.PaymentMethod.COD)
                .items(new ArrayList<>())
                .build();

        OrderEvent event = new OrderEvent(this, order, OrderEventType.COD_ORDER_PLACED);
        listener.handleOrderEvent(event);

        verify(shiprocketService).syncOrderToShiprocket(order);
    }

    @Test
    void handleOrderEvent_syncFails_doesNotThrow() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PAID)
                .items(new ArrayList<>())
                .build();

        doThrow(new RuntimeException("Sync failed")).when(shiprocketService).syncOrderToShiprocket(any());

        OrderEvent event = new OrderEvent(this, order, OrderEventType.PAYMENT_SUCCESS);
        listener.handleOrderEvent(event);

        verify(shiprocketService).syncOrderToShiprocket(order);
    }
}
