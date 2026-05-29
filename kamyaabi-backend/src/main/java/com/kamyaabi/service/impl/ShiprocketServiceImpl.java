package com.kamyaabi.service.impl;

import com.kamyaabi.config.ShiprocketProperties;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import com.kamyaabi.entity.Product;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.ShiprocketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class ShiprocketServiceImpl implements ShiprocketService {

    private static final String BASE_URL = "https://apiv2.shiprocket.in/v1/external";
    private static final DateTimeFormatter SR_DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ShiprocketProperties properties;
    private final OrderRepository orderRepository;
    private final RestTemplate restTemplate;

    public ShiprocketServiceImpl(ShiprocketProperties properties,
                                 OrderRepository orderRepository) {
        this.properties = properties;
        this.orderRepository = orderRepository;
        this.restTemplate = new RestTemplate();
    }

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

        try {
            log.info("Syncing order {} to Shiprocket", order.getId());

            Map<String, Object> srResponse = createShiprocketOrder(order);
            if (srResponse == null) {
                log.error("Shiprocket createOrder returned null for order {}", order.getId());
                return;
            }

            String srOrderId = String.valueOf(srResponse.get("order_id"));
            String shipmentId = String.valueOf(srResponse.get("shipment_id"));

            order.setShiprocketOrderId(srOrderId);
            order.setShiprocketShipmentId(shipmentId);
            order.setShiprocketSynced(true);
            log.info("Shiprocket order created: orderId={}, shipmentId={} for order {}",
                    srOrderId, shipmentId, order.getId());

            try {
                Map<String, Object> awbResponse = assignAwb(shipmentId);
                if (awbResponse != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> awbData = (Map<String, Object>) awbResponse.get("response");
                    if (awbData != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> awbAssignData = (Map<String, Object>) awbData.get("data");
                        if (awbAssignData != null) {
                            String awb = String.valueOf(awbAssignData.get("awb_code"));
                            String courier = String.valueOf(awbAssignData.get("courier_name"));
                            order.setAwbNumber(awb);
                            order.setCourierName(courier);
                            order.setShippingStatus("AWB_ASSIGNED");
                            log.info("AWB assigned: {} via {} for order {}", awb, courier, order.getId());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("AWB assignment failed for order {} — can be retried later: {}",
                        order.getId(), e.getMessage());
            }

            try {
                if (order.getShiprocketShipmentId() != null) {
                    requestPickup(order.getShiprocketShipmentId());
                    order.setPickupScheduledAt(LocalDateTime.now());
                    order.setShippingStatus("PICKUP_SCHEDULED");
                    log.info("Pickup requested for order {}", order.getId());
                }
            } catch (Exception e) {
                log.warn("Pickup request failed for order {} — can be retried later: {}",
                        order.getId(), e.getMessage());
            }

            orderRepository.save(order);

        } catch (Exception e) {
            log.error("Failed to sync order {} to Shiprocket: {}", order.getId(), e.getMessage(), e);
            order.setShiprocketSynced(false);
            orderRepository.save(order);
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

            HttpHeaders headers = buildAuthHeaders();
            Map<String, Object> body = new HashMap<>();
            body.put("ids", List.of(Integer.parseInt(order.getShiprocketOrderId())));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(BASE_URL + "/orders/cancel", request, Map.class);

            order.setShippingStatus("CANCELLED");
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
            HttpHeaders headers = buildAuthHeaders();
            HttpEntity<Void> request = new HttpEntity<>(headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    BASE_URL + "/courier/track/awb/" + awbNumber,
                    HttpMethod.GET, request,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);

            return response.getBody() != null ? response.getBody() : Collections.emptyMap();

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

    // ── Shiprocket API methods ──────────────────────────────────────────────

    private Map<String, Object> createShiprocketOrder(Order order) {
        HttpHeaders headers = buildAuthHeaders();

        Address addr = order.getShippingAddress();
        List<Map<String, Object>> items = new ArrayList<>();

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            Map<String, Object> srItem = new LinkedHashMap<>();
            srItem.put("name", product.getName());
            srItem.put("sku", "SKU-" + product.getId());
            srItem.put("units", item.getQuantity());
            srItem.put("selling_price", item.getPrice().doubleValue());
            srItem.put("discount", 0);
            srItem.put("tax", 0);
            items.add(srItem);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("order_id", String.valueOf(order.getId()));
        body.put("order_date", order.getCreatedAt().format(SR_DATE_FMT));
        body.put("pickup_location", properties.getPickupLocation());

        if (properties.getChannelId() != null && !properties.getChannelId().isBlank()) {
            body.put("channel_id", properties.getChannelId());
        }

        body.put("billing_customer_name", extractFirstName(addr.getFullName()));
        body.put("billing_last_name", extractLastName(addr.getFullName()));
        body.put("billing_address", addr.getStreet());
        body.put("billing_address_2", addr.getAddressLine2() != null ? addr.getAddressLine2() : "");
        body.put("billing_city", addr.getCity());
        body.put("billing_pincode", addr.getPincode());
        body.put("billing_state", addr.getState());
        body.put("billing_country", "India");
        body.put("billing_email", order.getUser().getEmail());
        body.put("billing_phone", addr.getPhone());

        body.put("shipping_is_billing", true);

        body.put("order_items", items);
        body.put("payment_method",
                order.getPaymentMethod() == Order.PaymentMethod.COD ? "COD" : "Prepaid");
        body.put("sub_total", order.getTotalAmount().doubleValue());

        body.put("length", properties.getDefaultLength());
        body.put("breadth", properties.getDefaultBreadth());
        body.put("height", properties.getDefaultHeight());
        body.put("weight", properties.getDefaultWeight());

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        log.debug("Shiprocket create order request for order {}: {}", order.getId(), body);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                BASE_URL + "/orders/create/adhoc", request,
                (Class<Map<String, Object>>) (Class<?>) Map.class);

        log.debug("Shiprocket create order response for order {}: status={}, body={}",
                order.getId(), response.getStatusCode(), response.getBody());

        return response.getBody();
    }

    private Map<String, Object> assignAwb(String shipmentId) {
        HttpHeaders headers = buildAuthHeaders();

        Map<String, Object> body = new HashMap<>();
        body.put("shipment_id", shipmentId);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                BASE_URL + "/courier/assign/awb", request,
                (Class<Map<String, Object>>) (Class<?>) Map.class);

        return response.getBody();
    }

    private void requestPickup(String shipmentId) {
        HttpHeaders headers = buildAuthHeaders();

        Map<String, Object> body = new HashMap<>();
        body.put("shipment_id", List.of(shipmentId));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity(BASE_URL + "/courier/generate/pickup", request, Map.class);
    }

    // ── Auth ────────────────────────────────────────────────────────────────

    private HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(properties.getApiToken());
        return headers;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private static String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts[0];
    }

    private static String extractLastName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "";
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }
}
