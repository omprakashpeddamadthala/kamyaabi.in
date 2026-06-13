package com.kamyaabi.service.shiprocket;

import com.kamyaabi.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
public class ShiprocketStatusMapper {

    private static final String SHIPPING_STATUS_OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY";

    public void applyTo(Order order, String shiprocketStatus) {
        if (shiprocketStatus == null) {
            return;
        }

        switch (shiprocketStatus.toUpperCase().trim()) {
            case "PICKED UP" -> order.setStatus(
                    order.getStatus() != Order.OrderStatus.SHIPPED
                            ? Order.OrderStatus.PROCESSING : order.getStatus());
            case "IN TRANSIT", "SHIPPED" -> order.setStatus(Order.OrderStatus.SHIPPED);
            case "OUT FOR DELIVERY" -> {
                order.setStatus(Order.OrderStatus.SHIPPED);
                order.setShippingStatus(SHIPPING_STATUS_OUT_FOR_DELIVERY);
            }
            case "DELIVERED" -> {
                order.setStatus(Order.OrderStatus.DELIVERED);
                if (order.getDeliveredAt() == null) {
                    order.setDeliveredAt(LocalDateTime.now());
                }
            }
            case "CANCELLED", "RTO INITIATED", "RTO" -> log.info(
                    "Shiprocket status '{}' received for order {} — not auto-updating order status",
                    shiprocketStatus, order.getId());
            default -> log.debug("Unmapped Shiprocket status '{}' for order {}", shiprocketStatus, order.getId());
        }
    }
}
