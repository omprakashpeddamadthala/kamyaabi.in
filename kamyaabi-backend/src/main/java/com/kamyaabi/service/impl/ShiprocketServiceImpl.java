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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Supplier;

@Slf4j
@Service
public class ShiprocketServiceImpl implements ShiprocketService {

    private static final String BASE_URL = "https://apiv2.shiprocket.in/v1/external";
    private static final DateTimeFormatter SR_DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ShiprocketProperties properties;
    private final OrderRepository orderRepository;
    private final RestTemplate restTemplate;

    private final Object tokenLock = new Object();
    private volatile String cachedToken;
    private volatile Instant cachedTokenExpiresAt;

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

        // Re-fetch order within this transaction to ensure all lazy associations
        // (items, shippingAddress, user) are available. The Order passed in may
        // be a detached entity from an @Async/@TransactionalEventListener context.
        Order managed = orderRepository.findByIdWithShiprocketDetails(order.getId())
                .orElse(null);
        if (managed == null) {
            log.error("Order {} not found in DB — cannot sync to Shiprocket", order.getId());
            return;
        }

        // Skip if already synced with a real Shiprocket order ID (idempotency guard).
        // Check for blank/"null" because String.valueOf(null) == "null".
        if (Boolean.TRUE.equals(managed.getShiprocketSynced())
                && isPresent(managed.getShiprocketOrderId())) {
            log.info("Order {} already synced to Shiprocket (srOrderId={}), skipping duplicate sync",
                    managed.getId(), managed.getShiprocketOrderId());
            return;
        }

        try {
            log.info("Syncing order {} to Shiprocket", managed.getId());

            Map<String, Object> srResponse = createShiprocketOrder(managed);
            if (srResponse == null) {
                log.error("Shiprocket createOrder returned null for order {}", managed.getId());
                managed.setShiprocketSynced(false);
                orderRepository.save(managed);
                return;
            }

            log.info("Shiprocket createOrder response for order {}: {}", managed.getId(), srResponse);

            String srOrderId = toSafeString(srResponse.get("order_id"));
            String shipmentId = toSafeString(srResponse.get("shipment_id"));

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
                try {
                    Map<String, Object> awbResponse = assignAwb(shipmentId);
                    if (awbResponse != null) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> awbData = (Map<String, Object>) awbResponse.get("response");
                        if (awbData != null) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> awbAssignData = (Map<String, Object>) awbData.get("data");
                            if (awbAssignData != null) {
                                String awb = toSafeString(awbAssignData.get("awb_code"));
                                String courier = toSafeString(awbAssignData.get("courier_name"));
                                if (awb != null) {
                                    managed.setAwbNumber(awb);
                                    managed.setCourierName(courier);
                                    managed.setShippingStatus("AWB_ASSIGNED");
                                    log.info("AWB assigned: {} via {} for order {}", awb, courier, managed.getId());
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("AWB assignment failed for order {} — can be retried later: {}",
                            managed.getId(), e.getMessage());
                }

                try {
                    requestPickup(shipmentId);
                    managed.setPickupScheduledAt(LocalDateTime.now());
                    managed.setShippingStatus("PICKUP_SCHEDULED");
                    log.info("Pickup requested for order {}", managed.getId());
                } catch (Exception e) {
                    log.warn("Pickup request failed for order {} — can be retried later: {}",
                            managed.getId(), e.getMessage());
                }
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

    @Override
    @Transactional
    public void cancelShiprocketOrder(Order order) {
        if (!isConfigured() || order.getShiprocketOrderId() == null) {
            return;
        }

        try {
            log.info("Cancelling Shiprocket order for order {}", order.getId());

            Map<String, Object> body = new HashMap<>();
            body.put("ids", List.of(Integer.parseInt(order.getShiprocketOrderId())));

            executeWithAuthRetry(() -> {
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildAuthHeaders());
                return restTemplate.postForEntity(BASE_URL + "/orders/cancel", request, Map.class);
            });

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
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = executeWithAuthRetry(() -> {
                HttpEntity<Void> request = new HttpEntity<>(buildAuthHeaders());
                return restTemplate.exchange(
                        BASE_URL + "/courier/track/awb/" + awbNumber,
                        HttpMethod.GET, request,
                        (Class<Map<String, Object>>) (Class<?>) Map.class);
            });

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

        double totalWeightKg = order.getItems().stream()
                .filter(i -> i.getWeightKg() != null)
                .mapToDouble(i -> i.getWeightKg().doubleValue() * i.getQuantity())
                .sum();
        body.put("weight", totalWeightKg > 0 ? totalWeightKg : properties.getDefaultWeight());

        log.info("Shiprocket create order request for order {}: {}", order.getId(), body);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = executeWithAuthRetry(() -> {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildAuthHeaders());
            return restTemplate.postForEntity(
                    BASE_URL + "/orders/create/adhoc", request,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);
        });

        log.debug("Shiprocket create order response for order {}: status={}, body={}",
                order.getId(), response.getStatusCode(), response.getBody());

        return response.getBody();
    }

    private Map<String, Object> assignAwb(String shipmentId) {
        Map<String, Object> body = new HashMap<>();
        body.put("shipment_id", shipmentId);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = executeWithAuthRetry(() -> {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildAuthHeaders());
            return restTemplate.postForEntity(
                    BASE_URL + "/courier/assign/awb", request,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);
        });

        return response.getBody();
    }

    private void requestPickup(String shipmentId) {
        Map<String, Object> body = new HashMap<>();
        body.put("shipment_id", List.of(shipmentId));

        executeWithAuthRetry(() -> {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildAuthHeaders());
            return restTemplate.postForEntity(BASE_URL + "/courier/generate/pickup", request, Map.class);
        });
    }

    // ── Auth ────────────────────────────────────────────────────────────────

    private HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(getToken());
        return headers;
    }

    /**
     * Returns a valid Shiprocket bearer token. Logs in and caches the token if
     * email/password credentials are configured; otherwise falls back to the
     * static {@code apiToken} property (legacy behaviour).
     */
    String getToken() {
        if (!properties.hasLoginCredentials()) {
            return properties.getApiToken();
        }

        Instant now = Instant.now();
        if (cachedToken != null && cachedTokenExpiresAt != null && now.isBefore(cachedTokenExpiresAt)) {
            return cachedToken;
        }

        synchronized (tokenLock) {
            if (cachedToken != null && cachedTokenExpiresAt != null && Instant.now().isBefore(cachedTokenExpiresAt)) {
                return cachedToken;
            }
            return refreshToken();
        }
    }

    /**
     * Forces a fresh login against Shiprocket's auth endpoint and updates the
     * cached token. Callers MUST hold {@link #tokenLock} when invoking this
     * method directly, except for the initial cache-miss path which already
     * holds the lock.
     */
    private String refreshToken() {
        if (!properties.hasLoginCredentials()) {
            // Fall back to static token; nothing to refresh.
            return properties.getApiToken();
        }

        log.info("Refreshing Shiprocket auth token via /auth/login");

        Map<String, String> body = new HashMap<>();
        body.put("email", ShiprocketProperties.sanitize(properties.getEmail()));
        body.put("password", ShiprocketProperties.sanitize(properties.getPassword()));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                BASE_URL + "/auth/login", request,
                (Class<Map<String, Object>>) (Class<?>) Map.class);

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || responseBody.get("token") == null) {
            throw new IllegalStateException("Shiprocket /auth/login returned no token");
        }

        String token = String.valueOf(responseBody.get("token"));
        this.cachedToken = token;
        this.cachedTokenExpiresAt = Instant.now().plusSeconds(properties.getTokenRefreshIntervalSeconds());
        log.info("Shiprocket auth token refreshed; next refresh after {}", cachedTokenExpiresAt);
        return token;
    }

    /**
     * Runs the supplied Shiprocket API call. If it fails with HTTP 401 and we
     * have login credentials configured, force a token refresh and retry the
     * call exactly once. This covers the common case where the cached token
     * (or an externally-rotated static token) has expired between scheduled
     * sync runs.
     */
    private <T> T executeWithAuthRetry(Supplier<T> apiCall) {
        try {
            return apiCall.get();
        } catch (HttpClientErrorException.Unauthorized e) {
            if (!properties.hasLoginCredentials()) {
                throw e;
            }
            log.warn("Shiprocket call returned 401 — forcing token refresh and retrying once");
            synchronized (tokenLock) {
                this.cachedToken = null;
                this.cachedTokenExpiresAt = null;
                refreshToken();
            }
            return apiCall.get();
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Converts an API response value to a non-blank String, or {@code null}
     * if the value is Java-null, the literal string {@code "null"} (produced
     * by {@code String.valueOf(null)}), or blank.
     */
    static String toSafeString(Object value) {
        if (value == null) return null;
        String s = String.valueOf(value).trim();
        return (s.isEmpty() || "null".equalsIgnoreCase(s)) ? null : s;
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank() && !"null".equalsIgnoreCase(value);
    }

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
