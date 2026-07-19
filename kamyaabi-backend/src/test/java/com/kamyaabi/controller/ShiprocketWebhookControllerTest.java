package com.kamyaabi.controller;

import com.kamyaabi.entity.Order;
import com.kamyaabi.event.OrderEventPublisher;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.shiprocket.ShiprocketStatusMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiprocketWebhookControllerTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderEventPublisher orderEventPublisher;

    private final ShiprocketStatusMapper statusMapper = new ShiprocketStatusMapper();
    private ShiprocketWebhookController controller;

    @BeforeEach
    void setUp() {
        controller = new ShiprocketWebhookController(orderRepository, orderEventPublisher, statusMapper);
    }

    @Test
    void handleWebhook_missingIdentifiers_returnsIgnored() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("current_status", "DELIVERED");

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ignored");
        assertThat(response.getBody()).containsEntry("reason", "missing_identifiers");
    }

    @Test
    void handleWebhook_orderNotFound_returnsIgnored() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB999");
        payload.put("current_status", "DELIVERED");

        when(orderRepository.findByAwbNumber("AWB999")).thenReturn(Optional.empty());

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ignored");
        assertThat(response.getBody()).containsEntry("reason", "order_not_found");
    }

    @Test
    void handleWebhook_delivered_updatesOrderStatus() {
        Order order = buildOrder();
        order.setAwbNumber("AWB123");
        order.setStatus(Order.OrderStatus.SHIPPED);

        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB123");
        payload.put("current_status", "DELIVERED");

        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ok");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.DELIVERED);
        assertThat(order.getDeliveredAt()).isNotNull();
        verify(orderRepository).save(order);
    }

    @Test
    void handleWebhook_inTransit_updatesOrderToShipped() {
        Order order = buildOrder();
        order.setAwbNumber("AWB123");
        order.setStatus(Order.OrderStatus.PROCESSING);

        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB123");
        payload.put("current_status", "IN TRANSIT");

        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ok");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.SHIPPED);
    }

    @Test
    void handleWebhook_cancelled_updatesOrderToCancelled() {
        Order order = buildOrder();
        order.setAwbNumber("AWB123");
        order.setStatus(Order.OrderStatus.SHIPPED);

        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB123");
        payload.put("current_status", "CANCELLED");

        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ok");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);
    }

    @Test
    void handleWebhook_pickedUp_updatesOrderToProcessing() {
        Order order = buildOrder();
        order.setAwbNumber("AWB123");
        order.setStatus(Order.OrderStatus.CONFIRMED);

        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB123");
        payload.put("current_status", "PICKED UP");

        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ok");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PROCESSING);
    }

    @Test
    void handleWebhook_outForDelivery_setsShippingStatus() {
        Order order = buildOrder();
        order.setAwbNumber("AWB123");
        order.setStatus(Order.OrderStatus.SHIPPED);

        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB123");
        payload.put("current_status", "OUT FOR DELIVERY");

        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ok");
        assertThat(order.getShippingStatus()).isEqualTo("OUT_FOR_DELIVERY");
    }

    @Test
    void handleWebhook_rto_setsReturnStatus() {
        Order order = buildOrder();
        order.setAwbNumber("AWB123");
        order.setStatus(Order.OrderStatus.SHIPPED);

        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB123");
        payload.put("current_status", "RTO");

        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ok");
        assertThat(order.getShippingStatus()).isEqualTo("RETURN_INITIATED");
    }

    @Test
    void handleWebhook_unknownStatus_stillSaves() {
        Order order = buildOrder();
        order.setAwbNumber("AWB123");
        order.setStatus(Order.OrderStatus.SHIPPED);

        Map<String, Object> payload = new HashMap<>();
        payload.put("awb", "AWB123");
        payload.put("current_status", "SOME_NEW_STATUS");

        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        ResponseEntity<Map<String, String>> response = controller.handleShiprocketWebhook(payload);

        assertThat(response.getBody()).containsEntry("status", "ok");
        assertThat(order.getShippingStatus()).isEqualTo("SOME_NEW_STATUS");
    }

    private Order buildOrder() {
        return Order.builder().id(1L)
                .totalAmount(new BigDecimal("1798.00"))
                .status(Order.OrderStatus.PAID)
                .items(new ArrayList<>())
                .build();
    }
}
