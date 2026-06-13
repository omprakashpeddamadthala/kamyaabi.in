package com.kamyaabi.service.shiprocket;

import com.kamyaabi.config.ShiprocketProperties;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import com.kamyaabi.entity.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ShiprocketApiClient {

    private static final DateTimeFormatter SR_DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final String COUNTRY_INDIA = "India";
    private static final String PAYMENT_COD = "COD";
    private static final String PAYMENT_PREPAID = "Prepaid";

    private final ShiprocketProperties properties;
    private final RestTemplate restTemplate;
    private final ShiprocketAuthClient authClient;

    public ShiprocketApiClient(ShiprocketProperties properties,
                               RestTemplate restTemplate,
                               ShiprocketAuthClient authClient) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.authClient = authClient;
    }

    public Map<String, Object> createOrder(Order order) {
        Map<String, Object> body = buildCreateOrderPayload(order);
        log.info("Shiprocket create order request for order {}: {}", order.getId(), body);

        ResponseEntity<Map<String, Object>> response = authClient.executeWithAuthRetry(() -> {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, authClient.buildAuthHeaders());
            return restTemplate.postForEntity(ShiprocketEndpoints.CREATE_ORDER, request, mapType());
        });

        log.debug("Shiprocket create order response for order {}: status={}, body={}",
                order.getId(), response.getStatusCode(), response.getBody());
        return response.getBody();
    }

    public Map<String, Object> assignAwb(String shipmentId) {
        Map<String, Object> body = new HashMap<>();
        body.put("shipment_id", shipmentId);

        ResponseEntity<Map<String, Object>> response = authClient.executeWithAuthRetry(() -> {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, authClient.buildAuthHeaders());
            return restTemplate.postForEntity(ShiprocketEndpoints.ASSIGN_AWB, request, mapType());
        });
        return response.getBody();
    }

    public void requestPickup(String shipmentId) {
        Map<String, Object> body = new HashMap<>();
        body.put("shipment_id", List.of(shipmentId));

        authClient.executeWithAuthRetry(() -> {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, authClient.buildAuthHeaders());
            return restTemplate.postForEntity(ShiprocketEndpoints.GENERATE_PICKUP, request, Map.class);
        });
    }

    public void cancelOrder(String shiprocketOrderId) {
        Map<String, Object> body = new HashMap<>();
        body.put("ids", List.of(Integer.parseInt(shiprocketOrderId)));

        authClient.executeWithAuthRetry(() -> {
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, authClient.buildAuthHeaders());
            return restTemplate.postForEntity(ShiprocketEndpoints.CANCEL_ORDER, request, Map.class);
        });
    }

    public Map<String, Object> trackByAwb(String awbNumber) {
        ResponseEntity<Map<String, Object>> response = authClient.executeWithAuthRetry(() -> {
            HttpEntity<Void> request = new HttpEntity<>(authClient.buildAuthHeaders());
            return restTemplate.exchange(
                    ShiprocketEndpoints.TRACK_AWB + awbNumber, HttpMethod.GET, request, mapType());
        });
        return response.getBody();
    }

    public Map<String, Object> getServiceability(String deliveryPincode, double weight) {
        String url = ShiprocketEndpoints.SERVICEABILITY
                + "?pickup_postcode=" + properties.getPickupPincode().trim()
                + "&delivery_postcode=" + deliveryPincode.trim()
                + "&weight=" + weight
                + "&cod=1";

        ResponseEntity<Map<String, Object>> response = authClient.executeWithAuthRetry(() -> {
            HttpEntity<Void> request = new HttpEntity<>(authClient.buildAuthHeaders());
            return restTemplate.exchange(url, HttpMethod.GET, request, mapType());
        });
        return response.getBody();
    }

    public Map<String, Object> showOrder(String shiprocketOrderId) {
        ResponseEntity<Map<String, Object>> response = authClient.executeWithAuthRetry(() -> {
            HttpEntity<Void> request = new HttpEntity<>(authClient.buildAuthHeaders());
            return restTemplate.exchange(
                    ShiprocketEndpoints.SHOW_ORDER + shiprocketOrderId, HttpMethod.GET, request, mapType());
        });
        return response.getBody();
    }

    private Map<String, Object> buildCreateOrderPayload(Order order) {
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

        body.put("billing_customer_name", ShiprocketResponseParser.firstName(addr.getFullName()));
        body.put("billing_last_name", ShiprocketResponseParser.lastName(addr.getFullName()));
        body.put("billing_address", addr.getStreet());
        body.put("billing_address_2", addr.getAddressLine2() != null ? addr.getAddressLine2() : "");
        body.put("billing_city", addr.getCity());
        body.put("billing_pincode", addr.getPincode());
        body.put("billing_state", addr.getState());
        body.put("billing_country", COUNTRY_INDIA);
        body.put("billing_email", order.getUser().getEmail());
        body.put("billing_phone", addr.getPhone());

        body.put("shipping_is_billing", true);

        body.put("order_items", items);
        body.put("payment_method",
                order.getPaymentMethod() == Order.PaymentMethod.COD ? PAYMENT_COD : PAYMENT_PREPAID);
        body.put("sub_total", order.getTotalAmount().doubleValue());

        body.put("length", properties.getDefaultLength());
        body.put("breadth", properties.getDefaultBreadth());
        body.put("height", properties.getDefaultHeight());

        double totalWeightKg = order.getItems().stream()
                .filter(i -> i.getWeightKg() != null)
                .mapToDouble(i -> i.getWeightKg().doubleValue() * i.getQuantity())
                .sum();
        body.put("weight", totalWeightKg > 0 ? totalWeightKg : properties.getDefaultWeight());

        return body;
    }

    @SuppressWarnings("unchecked")
    private static Class<Map<String, Object>> mapType() {
        return (Class<Map<String, Object>>) (Class<?>) Map.class;
    }
}
