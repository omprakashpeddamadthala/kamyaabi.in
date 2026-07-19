package com.kamyaabi.service.shiprocket;

import com.kamyaabi.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Canonical Shiprocket → internal status mapper.
 * <p>
 * This is the <strong>single source of truth</strong> for mapping raw Shiprocket
 * shipment status strings to our {@link Order.OrderStatus} enum and the
 * {@code shippingStatus} string field.  Both the scheduled refresh job
 * ({@link com.kamyaabi.service.impl.ShiprocketServiceImpl}) and the
 * {@link com.kamyaabi.controller.ShiprocketWebhookController} must delegate
 * here — no independent mapping logic may exist elsewhere.
 * </p>
 */
@Slf4j
@Component
public class ShiprocketStatusMapper {

    private static final String SHIPPING_STATUS_OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY";
    private static final String SHIPPING_STATUS_RETURN_INITIATED  = "RETURN_INITIATED";

    /**
     * Apply the Shiprocket status string to the given {@link Order}.
     * The caller is responsible for persisting the entity afterwards.
     *
     * @param order           the managed order entity (mutated in place)
     * @param shiprocketStatus raw status string from Shiprocket (case-insensitive)
     */
    public void applyTo(Order order, String shiprocketStatus) {
        if (shiprocketStatus == null) {
            return;
        }

        String normalized = shiprocketStatus.toUpperCase().trim();
        log.debug("Applying Shiprocket status '{}' to order {}", normalized, order.getId());

        switch (normalized) {
            case "PICKED UP" -> {
                if (order.getStatus() != Order.OrderStatus.SHIPPED) {
                    order.setStatus(Order.OrderStatus.PROCESSING);
                }
            }
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
            case "CANCELLED" -> {
                order.setStatus(Order.OrderStatus.CANCELLED);
                log.info("Shiprocket CANCELLED status applied to order {}", order.getId());
            }
            case "RTO INITIATED", "RTO" -> {
                order.setShippingStatus(SHIPPING_STATUS_RETURN_INITIATED);
                log.info("Shiprocket RTO status '{}' received for order {} — shippingStatus set to RETURN_INITIATED",
                        shiprocketStatus, order.getId());
            }
            default -> log.debug("Unmapped Shiprocket status '{}' for order {}", shiprocketStatus, order.getId());
        }
    }
}
