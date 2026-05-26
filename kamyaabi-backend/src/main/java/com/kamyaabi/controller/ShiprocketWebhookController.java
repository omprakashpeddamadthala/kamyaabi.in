package com.kamyaabi.controller;

import com.kamyaabi.entity.Order;
import com.kamyaabi.event.OrderEventPublisher;
import com.kamyaabi.event.OrderEventType;
import com.kamyaabi.repository.OrderRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@Tag(name = "Webhooks", description = "Incoming webhook endpoints for third-party integrations")
public class ShiprocketWebhookController {

    private final OrderRepository orderRepository;
    private final OrderEventPublisher orderEventPublisher;

    public ShiprocketWebhookController(OrderRepository orderRepository,
                                       OrderEventPublisher orderEventPublisher) {
        this.orderRepository = orderRepository;
        this.orderEventPublisher = orderEventPublisher;
    }

    @PostMapping("/shiprocket")
    @Operation(summary = "Shiprocket status webhook",
            description = "Receives shipment status updates from Shiprocket and updates order status accordingly")
    @Transactional
    public ResponseEntity<Map<String, String>> handleShiprocketWebhook(
            @RequestBody Map<String, Object> payload) {

        log.info("Received Shiprocket webhook: {}", payload);

        try {
            String awb = extractString(payload, "awb");
            String currentStatus = extractString(payload, "current_status");
            String srOrderId = extractString(payload, "sr_order_id");

            if (awb == null && srOrderId == null) {
                log.warn("Shiprocket webhook missing both awb and sr_order_id");
                return ResponseEntity.ok(Map.of("status", "ignored", "reason", "missing_identifiers"));
            }

            Optional<Order> orderOpt = Optional.empty();
            if (awb != null && !awb.isBlank()) {
                orderOpt = orderRepository.findByAwbNumber(awb);
            }
            if (orderOpt.isEmpty() && srOrderId != null && !srOrderId.isBlank()) {
                orderOpt = orderRepository.findAll().stream()
                        .filter(o -> srOrderId.equals(o.getShiprocketOrderId()))
                        .findFirst();
            }

            if (orderOpt.isEmpty()) {
                log.warn("No order found for AWB {} or Shiprocket order {}", awb, srOrderId);
                return ResponseEntity.ok(Map.of("status", "ignored", "reason", "order_not_found"));
            }

            Order order = orderOpt.get();
            order.setShippingStatus(currentStatus);

            if (currentStatus != null) {
                mapShiprocketStatusToOrderStatus(order, currentStatus);
            }

            orderRepository.save(order);
            log.info("Order {} updated with Shiprocket status: {}", order.getId(), currentStatus);

            return ResponseEntity.ok(Map.of("status", "ok"));

        } catch (Exception e) {
            log.error("Error processing Shiprocket webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    private void mapShiprocketStatusToOrderStatus(Order order, String shiprocketStatus) {
        String statusUpper = shiprocketStatus.toUpperCase().trim();
        Order.OrderStatus previousStatus = order.getStatus();

        switch (statusUpper) {
            case "PICKED UP" -> {
                if (previousStatus != Order.OrderStatus.SHIPPED) {
                    order.setStatus(Order.OrderStatus.PROCESSING);
                    orderEventPublisher.publishOrderEvent(order, OrderEventType.ORDER_PROCESSING);
                }
            }
            case "IN TRANSIT", "SHIPPED" -> {
                order.setStatus(Order.OrderStatus.SHIPPED);
                orderEventPublisher.publishOrderEvent(order, OrderEventType.ORDER_SHIPPED);
            }
            case "OUT FOR DELIVERY" -> {
                order.setStatus(Order.OrderStatus.SHIPPED);
                order.setShippingStatus("OUT_FOR_DELIVERY");
            }
            case "DELIVERED" -> {
                order.setStatus(Order.OrderStatus.DELIVERED);
                order.setDeliveredAt(LocalDateTime.now());
                orderEventPublisher.publishOrderEvent(order, OrderEventType.ORDER_DELIVERED);
            }
            case "RTO INITIATED", "RTO" -> {
                order.setShippingStatus("RETURN_INITIATED");
            }
            case "CANCELLED" -> {
                order.setStatus(Order.OrderStatus.CANCELLED);
                orderEventPublisher.publishOrderEvent(order, OrderEventType.ORDER_CANCELLED);
            }
            default -> log.info("Unmapped Shiprocket status '{}' for order {}", shiprocketStatus, order.getId());
        }
    }

    private static String extractString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : null;
    }
}
