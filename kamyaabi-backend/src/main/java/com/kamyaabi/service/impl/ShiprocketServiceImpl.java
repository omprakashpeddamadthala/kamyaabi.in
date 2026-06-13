package com.kamyaabi.service.impl;

import com.kamyaabi.config.ShiprocketProperties;
import com.kamyaabi.dto.response.PincodeServiceabilityResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.ShiprocketService;
import com.kamyaabi.service.shiprocket.ShiprocketApiClient;
import com.kamyaabi.service.shiprocket.ShiprocketResponseParser;
import com.kamyaabi.service.shiprocket.ShiprocketStatusMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShiprocketServiceImpl implements ShiprocketService {

    private static final String STATUS_AWB_ASSIGNED = "AWB_ASSIGNED";
    private static final String STATUS_PICKUP_SCHEDULED = "PICKUP_SCHEDULED";
    private static final String STATUS_CANCELLED = "CANCELLED";

    private final ShiprocketProperties properties;
    private final OrderRepository orderRepository;
    private final ShiprocketApiClient apiClient;
    private final ShiprocketStatusMapper statusMapper;

    @Override
    public boolean isConfigured() {
        return properties.isConfigured();
    }

    @Override
    @Transactional
    public void syncOrderToShiprocket(Order order) {
        if (!isConfigured()) {
            log.warn("Shiprocket not configured — skipping sync for order {}", order.getId());
            return;
        }

        Order managed = orderRepository.findByIdWithShiprocketDetails(order.getId())
                .orElse(null);
        if (managed == null) {
            log.error("Order {} not found in DB — cannot sync to Shiprocket", order.getId());
            return;
        }

        if (Boolean.TRUE.equals(managed.getShiprocketSynced())
                && ShiprocketResponseParser.isPresent(managed.getShiprocketOrderId())) {
            log.info("Order {} already synced to Shiprocket (srOrderId={}), skipping duplicate sync",
                    managed.getId(), managed.getShiprocketOrderId());
            return;
        }

        try {
            log.info("Syncing order {} to Shiprocket", managed.getId());

            Map<String, Object> srResponse = apiClient.createOrder(managed);
            if (srResponse == null) {
                log.error("Shiprocket createOrder returned null for order {}", managed.getId());
                managed.setShiprocketSynced(false);
                orderRepository.save(managed);
                return;
            }

            log.info("Shiprocket createOrder response for order {}: {}", managed.getId(), srResponse);

            String srOrderId = ShiprocketResponseParser.toSafeString(srResponse.get("order_id"));
            String shipmentId = ShiprocketResponseParser.toSafeString(srResponse.get("shipment_id"));

            if (srOrderId == null) {
                log.error("Shiprocket createOrder returned no order_id for order {} — response: {}",
                        managed.getId(), srResponse);
                managed.setShiprocketSynced(false);
                orderRepository.save(managed);
                return;
            }

            managed.setShiprocketOrderId(srOrderId);
            managed.setShiprocketShipmentId(shipmentId);
            managed.setShiprocketSynced(true);
            log.info("Shiprocket order created: orderId={}, shipmentId={} for order {}",
                    srOrderId, shipmentId, managed.getId());

            if (shipmentId != null) {
                assignAwbToOrder(managed, shipmentId);
                schedulePickup(managed, shipmentId);
            } else {
                log.warn("No shipment_id returned for order {} — AWB/pickup will be skipped; "
                        + "order is synced but needs manual courier assignment in Shiprocket dashboard",
                        managed.getId());
            }

            orderRepository.save(managed);

        } catch (Exception e) {
            log.error("Failed to sync order {} to Shiprocket: {}", managed.getId(), e.getMessage(), e);
            managed.setShiprocketSynced(false);
            orderRepository.save(managed);
        }
    }

    private void assignAwbToOrder(Order managed, String shipmentId) {
        try {
            Map<String, Object> awbResponse = apiClient.assignAwb(shipmentId);
            if (awbResponse == null) {
                return;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> awbData = (Map<String, Object>) awbResponse.get("response");
            if (awbData == null) {
                return;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> awbAssignData = (Map<String, Object>) awbData.get("data");
            if (awbAssignData == null) {
                return;
            }
            String awb = ShiprocketResponseParser.toSafeString(awbAssignData.get("awb_code"));
            String courier = ShiprocketResponseParser.toSafeString(awbAssignData.get("courier_name"));
            if (awb != null) {
                managed.setAwbNumber(awb);
                managed.setCourierName(courier);
                managed.setShippingStatus(STATUS_AWB_ASSIGNED);
                log.info("AWB assigned: {} via {} for order {}", awb, courier, managed.getId());
            }
        } catch (Exception e) {
            log.warn("AWB assignment failed for order {} — can be retried later: {}",
                    managed.getId(), e.getMessage());
        }
    }

    private void schedulePickup(Order managed, String shipmentId) {
        try {
            apiClient.requestPickup(shipmentId);
            managed.setPickupScheduledAt(LocalDateTime.now());
            managed.setShippingStatus(STATUS_PICKUP_SCHEDULED);
            log.info("Pickup requested for order {}", managed.getId());
        } catch (Exception e) {
            log.warn("Pickup request failed for order {} — can be retried later: {}",
                    managed.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public void cancelShiprocketOrder(Order order) {
        if (!isConfigured() || order.getShiprocketOrderId() == null) {
            return;
        }

        try {
            log.info("Cancelling Shiprocket order for order {}", order.getId());
            apiClient.cancelOrder(order.getShiprocketOrderId());
            order.setShippingStatus(STATUS_CANCELLED);
            orderRepository.save(order);
            log.info("Shiprocket order cancelled for order {}", order.getId());
        } catch (Exception e) {
            log.error("Failed to cancel Shiprocket order for order {}: {}",
                    order.getId(), e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> trackShipment(String awbNumber) {
        if (!isConfigured() || awbNumber == null || awbNumber.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            Map<String, Object> body = apiClient.trackByAwb(awbNumber);
            return body != null ? body : Collections.emptyMap();
        } catch (Exception e) {
            log.error("Failed to track AWB {}: {}", awbNumber, e.getMessage());
            return Collections.emptyMap();
        }
    }

    @Override
    @Scheduled(fixedDelayString = "${app.shiprocket.retry-interval-ms:300000}")
    @Transactional
    public void retryFailedOrders() {
        if (!isConfigured()) {
            return;
        }

        List<Order> failedOrders = orderRepository.findByShiprocketSyncedFalseAndStatusIn(
                List.of(Order.OrderStatus.PAID, Order.OrderStatus.CONFIRMED, Order.OrderStatus.PROCESSING));

        if (failedOrders.isEmpty()) {
            return;
        }

        log.info("Retrying Shiprocket sync for {} failed orders", failedOrders.size());

        for (Order order : failedOrders) {
            try {
                syncOrderToShiprocket(order);
            } catch (Exception e) {
                log.error("Retry failed for order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    @Override
    public PincodeServiceabilityResponse checkServiceability(String pincode, double weight) {
        if (!isConfigured()) {
            return notServiceable(pincode, "Shipping service is not configured");
        }

        String pickupPincode = properties.getPickupPincode();
        if (pickupPincode == null || pickupPincode.isBlank()) {
            return notServiceable(pincode, "Pickup pincode is not configured");
        }

        try {
            Map<String, Object> body = apiClient.getServiceability(pincode, weight);
            if (body == null) {
                return notServiceable(pincode, "No response from shipping service");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) {
                return notServiceable(pincode, "Delivery is not available to this pincode");
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> couriers = (List<Map<String, Object>>) data.get("available_courier_companies");
            if (couriers == null || couriers.isEmpty()) {
                return notServiceable(pincode, "Delivery is not available to this pincode");
            }

            return toServiceableResponse(pincode, couriers.get(0));

        } catch (Exception e) {
            log.error("Serviceability check failed for pincode {}: {}", pincode, e.getMessage());
            return notServiceable(pincode, "Unable to verify delivery availability. Please try again.");
        }
    }

    private PincodeServiceabilityResponse toServiceableResponse(String pincode, Map<String, Object> bestCourier) {
        Object codObj = bestCourier.get("cod");
        String cod = codObj != null && ("1".equals(String.valueOf(codObj)) || Boolean.TRUE.equals(codObj))
                ? "Yes" : "No";

        return PincodeServiceabilityResponse.builder()
                .serviceable(true)
                .pincode(pincode)
                .city(ShiprocketResponseParser.toSafeString(bestCourier.get("city")))
                .state(ShiprocketResponseParser.toSafeString(bestCourier.get("state")))
                .estimatedDays(ShiprocketResponseParser.parseEstimatedDays(bestCourier.get("estimated_delivery_days")))
                .courierName(ShiprocketResponseParser.toSafeString(bestCourier.get("courier_name")))
                .codAvailable(cod)
                .message("Delivery is available to this pincode")
                .build();
    }

    private PincodeServiceabilityResponse notServiceable(String pincode, String message) {
        return PincodeServiceabilityResponse.builder()
                .serviceable(false)
                .pincode(pincode)
                .message(message)
                .build();
    }

    @Override
    @Transactional
    public void refreshShipmentStatus(Order order) {
        if (!isConfigured()) {
            log.warn("Shiprocket not configured — skipping status refresh for order {}", order.getId());
            return;
        }

        if (order.getShiprocketOrderId() == null || order.getShiprocketOrderId().isBlank()) {
            log.warn("Order {} has no Shiprocket order ID — cannot refresh status", order.getId());
            return;
        }

        try {
            log.info("Refreshing shipment status from Shiprocket for order {} (srOrderId={})",
                    order.getId(), order.getShiprocketOrderId());

            Map<String, Object> body = apiClient.showOrder(order.getShiprocketOrderId());
            if (body == null) {
                log.warn("Shiprocket returned empty body for order {}", order.getId());
                return;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> orderData = (Map<String, Object>) body.get("data");
            if (orderData == null) {
                orderData = body;
            }

            Map<String, Object> shipment = ShiprocketResponseParser.extractFirstShipment(orderData);
            if (shipment == null) {
                log.info("No shipments found in Shiprocket response for order {}", order.getId());
                return;
            }

            applyShipmentUpdates(order, shipment);

        } catch (Exception e) {
            log.error("Failed to refresh shipment status for order {}: {}",
                    order.getId(), e.getMessage(), e);
        }
    }

    private void applyShipmentUpdates(Order order, Map<String, Object> shipment) {
        String awb = ShiprocketResponseParser.toSafeString(shipment.get("awb_code"));
        String courier = ShiprocketResponseParser.toSafeString(shipment.get("courier_name"));
        String status = ShiprocketResponseParser.toSafeString(shipment.get("status"));
        String shipmentId = ShiprocketResponseParser.toSafeString(shipment.get("id"));

        boolean updated = false;

        if (awb != null && isBlank(order.getAwbNumber())) {
            order.setAwbNumber(awb);
            updated = true;
        }
        if (courier != null && isBlank(order.getCourierName())) {
            order.setCourierName(courier);
            updated = true;
        }
        if (shipmentId != null && isBlank(order.getShiprocketShipmentId())) {
            order.setShiprocketShipmentId(shipmentId);
            updated = true;
        }
        if (status != null) {
            order.setShippingStatus(status);
            updated = true;
            statusMapper.applyTo(order, status);
        }

        if (updated) {
            orderRepository.save(order);
            log.info("Order {} updated from Shiprocket: awb={}, courier={}, status={}",
                    order.getId(), awb, courier, status);
        } else {
            log.info("No new status data from Shiprocket for order {}", order.getId());
        }
    }

    @Override
    @Transactional
    public int refreshAllShipmentStatuses() {
        if (!isConfigured()) {
            return 0;
        }

        List<Order> orders = orderRepository.findSyncedOrdersNotInTerminalStatus(
                List.of(Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED));

        if (orders.isEmpty()) {
            return 0;
        }

        log.info("Refreshing shipment status for {} synced orders", orders.size());
        int refreshed = 0;
        for (Order order : orders) {
            try {
                refreshShipmentStatus(order);
                refreshed++;
            } catch (Exception e) {
                log.error("Status refresh failed for order {}: {}", order.getId(), e.getMessage());
            }
        }
        return refreshed;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
