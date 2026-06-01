package com.kamyaabi.service.impl;

import com.kamyaabi.config.ShiprocketProperties;
import com.kamyaabi.entity.*;
import com.kamyaabi.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShiprocketServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private RestTemplate restTemplate;

    private ShiprocketProperties properties;
    private ShiprocketServiceImpl shiprocketService;

    @BeforeEach
    void setUp() {
        properties = new ShiprocketProperties();
        properties.setApiToken("test-api-token-123");
        properties.setPickupLocation("home");
        properties.setDefaultWeight(0.5);
        properties.setDefaultLength(10);
        properties.setDefaultBreadth(10);
        properties.setDefaultHeight(10);

        shiprocketService = new ShiprocketServiceImpl(properties, orderRepository);
        try {
            java.lang.reflect.Field field = ShiprocketServiceImpl.class.getDeclaredField("restTemplate");
            field.setAccessible(true);
            field.set(shiprocketService, restTemplate);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void isConfigured_whenTokenSet_returnsTrue() {
        assertThat(shiprocketService.isConfigured()).isTrue();
    }

    @Test
    void isConfigured_whenTokenBlank_returnsFalse() {
        properties.setApiToken("");
        assertThat(shiprocketService.isConfigured()).isFalse();
    }

    @Test
    void syncOrderToShiprocket_whenNotConfigured_skips() {
        properties.setApiToken("");
        Order order = buildOrder();
        shiprocketService.syncOrderToShiprocket(order);
        verifyNoInteractions(restTemplate);
        verify(orderRepository, never()).save(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncOrderToShiprocket_success_setsFieldsAndSaves() {
        Order order = buildOrder();
        when(orderRepository.findByIdWithShiprocketDetails(order.getId())).thenReturn(Optional.of(order));

        Map<String, Object> createResponse = new HashMap<>();
        createResponse.put("order_id", 12345);
        createResponse.put("shipment_id", 67890);
        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(createResponse));

        Map<String, Object> awbData = new HashMap<>();
        awbData.put("awb_code", "AWB123456");
        awbData.put("courier_name", "Delhivery");
        Map<String, Object> awbResponseData = new HashMap<>();
        awbResponseData.put("data", awbData);
        Map<String, Object> awbResponse = new HashMap<>();
        awbResponse.put("response", awbResponseData);
        when(restTemplate.postForEntity(
                contains("/courier/assign/awb"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(awbResponse));

        when(restTemplate.postForEntity(
                contains("/courier/generate/pickup"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(Map.of()));

        shiprocketService.syncOrderToShiprocket(order);

        assertThat(order.getShiprocketOrderId()).isEqualTo("12345");
        assertThat(order.getShiprocketShipmentId()).isEqualTo("67890");
        assertThat(order.getAwbNumber()).isEqualTo("AWB123456");
        assertThat(order.getCourierName()).isEqualTo("Delhivery");
        assertThat(order.getShiprocketSynced()).isTrue();
        assertThat(order.getPickupScheduledAt()).isNotNull();
        verify(orderRepository).save(order);
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncOrderToShiprocket_createOrderFails_marksSyncedFalse() {
        Order order = buildOrder();
        when(orderRepository.findByIdWithShiprocketDetails(order.getId())).thenReturn(Optional.of(order));

        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenThrow(new RuntimeException("API error"));

        shiprocketService.syncOrderToShiprocket(order);

        assertThat(order.getShiprocketSynced()).isFalse();
        verify(orderRepository).save(order);
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncOrderToShiprocket_nullOrderIdInResponse_marksSyncedFalse() {
        Order order = buildOrder();
        when(orderRepository.findByIdWithShiprocketDetails(order.getId())).thenReturn(Optional.of(order));

        Map<String, Object> createResponse = new HashMap<>();
        createResponse.put("order_id", null);
        createResponse.put("shipment_id", null);
        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(createResponse));

        shiprocketService.syncOrderToShiprocket(order);

        assertThat(order.getShiprocketSynced()).isFalse();
        assertThat(order.getShiprocketOrderId()).isNull();
        verify(orderRepository).save(order);
    }

    @Test
    void toSafeString_handlesNullAndStringNull() {
        assertThat(ShiprocketServiceImpl.toSafeString(null)).isNull();
        assertThat(ShiprocketServiceImpl.toSafeString("null")).isNull();
        assertThat(ShiprocketServiceImpl.toSafeString("NULL")).isNull();
        assertThat(ShiprocketServiceImpl.toSafeString("")).isNull();
        assertThat(ShiprocketServiceImpl.toSafeString("  ")).isNull();
        assertThat(ShiprocketServiceImpl.toSafeString(12345)).isEqualTo("12345");
        assertThat(ShiprocketServiceImpl.toSafeString("AWB123")).isEqualTo("AWB123");
    }

    @Test
    void cancelShiprocketOrder_whenNotSynced_skips() {
        Order order = buildOrder();
        order.setShiprocketOrderId(null);

        shiprocketService.cancelShiprocketOrder(order);
        verifyNoInteractions(restTemplate);
    }

    @Test
    @SuppressWarnings("unchecked")
    void cancelShiprocketOrder_success_updatesStatus() {
        Order order = buildOrder();
        order.setShiprocketOrderId("12345");

        when(restTemplate.postForEntity(
                contains("/orders/cancel"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(Map.of()));

        shiprocketService.cancelShiprocketOrder(order);

        assertThat(order.getShippingStatus()).isEqualTo("CANCELLED");
        verify(orderRepository).save(order);
    }

    @Test
    void trackShipment_whenNotConfigured_returnsEmpty() {
        properties.setApiToken("");
        Map<String, Object> result = shiprocketService.trackShipment("AWB123");
        assertThat(result).isEmpty();
    }

    @Test
    void trackShipment_whenAwbNull_returnsEmpty() {
        Map<String, Object> result = shiprocketService.trackShipment(null);
        assertThat(result).isEmpty();
    }

    @Test
    void trackShipment_whenAwbBlank_returnsEmpty() {
        Map<String, Object> result = shiprocketService.trackShipment("");
        assertThat(result).isEmpty();
    }

    @Test
    @SuppressWarnings("unchecked")
    void trackShipment_success_returnsData() {
        Map<String, Object> trackingData = new HashMap<>();
        trackingData.put("tracking_data", Map.of("track_status", 1));
        when(restTemplate.exchange(
                contains("/courier/track/awb/AWB123"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(trackingData));

        Map<String, Object> result = shiprocketService.trackShipment("AWB123");
        assertThat(result).containsKey("tracking_data");
    }

    @Test
    @SuppressWarnings("unchecked")
    void trackShipment_apiFails_returnsEmpty() {
        when(restTemplate.exchange(
                contains("/courier/track/awb/"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(Class.class)))
                .thenThrow(new RuntimeException("API error"));

        Map<String, Object> result = shiprocketService.trackShipment("AWB123");
        assertThat(result).isEmpty();
    }

    @Test
    void retryFailedOrders_whenNotConfigured_skips() {
        properties.setApiToken("");
        shiprocketService.retryFailedOrders();
        verify(orderRepository, never()).findByShiprocketSyncedFalseAndStatusIn(any());
    }

    @Test
    void retryFailedOrders_noFailedOrders_doesNothing() {
        when(orderRepository.findByShiprocketSyncedFalseAndStatusIn(any()))
                .thenReturn(Collections.emptyList());

        shiprocketService.retryFailedOrders();

        verify(orderRepository).findByShiprocketSyncedFalseAndStatusIn(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncOrderToShiprocket_awbAssignmentFails_stillSavesOrder() {
        Order order = buildOrder();
        when(orderRepository.findByIdWithShiprocketDetails(order.getId())).thenReturn(Optional.of(order));

        Map<String, Object> createResponse = new HashMap<>();
        createResponse.put("order_id", 12345);
        createResponse.put("shipment_id", 67890);
        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(createResponse));

        when(restTemplate.postForEntity(
                contains("/courier/assign/awb"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenThrow(new RuntimeException("AWB failure"));

        when(restTemplate.postForEntity(
                contains("/courier/generate/pickup"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenThrow(new RuntimeException("Pickup failure"));

        shiprocketService.syncOrderToShiprocket(order);

        assertThat(order.getShiprocketOrderId()).isEqualTo("12345");
        assertThat(order.getShiprocketSynced()).isTrue();
        assertThat(order.getAwbNumber()).isNull();
        verify(orderRepository).save(order);
    }

    @Test
    @SuppressWarnings("unchecked")
    void getToken_loginCredentialsSet_callsAuthLoginAndCachesToken() {
        properties.setApiToken("");
        properties.setEmail("merchant@example.com");
        properties.setPassword("secret");

        Map<String, Object> loginResponse = new HashMap<>();
        loginResponse.put("token", "fresh-token-from-login");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(loginResponse));

        String token = shiprocketService.getToken();
        assertThat(token).isEqualTo("fresh-token-from-login");

        // Second call should hit the cache (no extra /auth/login invocation).
        shiprocketService.getToken();
        verify(restTemplate, times(1)).postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class));
    }

    @Test
    void getToken_noLoginCredentials_returnsStaticToken() {
        properties.setApiToken("static-token");
        properties.setEmail("");
        properties.setPassword("");

        assertThat(shiprocketService.getToken()).isEqualTo("static-token");
        verifyNoInteractions(restTemplate);
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncOrderToShiprocket_when401_forcesReloginAndRetries() {
        properties.setApiToken("");
        properties.setEmail("merchant@example.com");
        properties.setPassword("secret");

        // /auth/login returns a fresh token on every call.
        Map<String, Object> loginResponse = new HashMap<>();
        loginResponse.put("token", "refreshed-token");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(loginResponse));

        // First create-order call fails with 401; second call succeeds.
        Map<String, Object> createResponse = new HashMap<>();
        createResponse.put("order_id", 12345);
        createResponse.put("shipment_id", 67890);
        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenThrow(org.springframework.web.client.HttpClientErrorException.create(
                        HttpStatus.UNAUTHORIZED, "Unauthorized",
                        new HttpHeaders(), new byte[0], null))
                .thenReturn(ResponseEntity.ok(createResponse));

        // AWB + pickup succeed so we exercise the full happy path post-retry.
        Map<String, Object> awbResponseData = new HashMap<>();
        awbResponseData.put("data", Map.of("awb_code", "AWB1", "courier_name", "Delhivery"));
        Map<String, Object> awbResponse = new HashMap<>();
        awbResponse.put("response", awbResponseData);
        when(restTemplate.postForEntity(
                contains("/courier/assign/awb"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(awbResponse));
        when(restTemplate.postForEntity(
                contains("/courier/generate/pickup"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(Map.of()));

        Order order = buildOrder();
        when(orderRepository.findByIdWithShiprocketDetails(order.getId())).thenReturn(Optional.of(order));
        shiprocketService.syncOrderToShiprocket(order);

        assertThat(order.getShiprocketOrderId()).isEqualTo("12345");
        assertThat(order.getShiprocketSynced()).isTrue();
        // /orders/create/adhoc should have been called twice (initial + retry).
        verify(restTemplate, times(2)).postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class));
        // /auth/login should have been called at least once to refresh.
        verify(restTemplate, atLeastOnce()).postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncOrderToShiprocket_when401WithoutLoginCredentials_doesNotRetry() {
        properties.setApiToken("static-token");
        properties.setEmail("");
        properties.setPassword("");

        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenThrow(org.springframework.web.client.HttpClientErrorException.create(
                        HttpStatus.UNAUTHORIZED, "Unauthorized",
                        new HttpHeaders(), new byte[0], null));

        Order order = buildOrder();
        when(orderRepository.findByIdWithShiprocketDetails(order.getId())).thenReturn(Optional.of(order));
        shiprocketService.syncOrderToShiprocket(order);

        assertThat(order.getShiprocketSynced()).isFalse();
        // Should NOT call /auth/login when no login credentials are configured.
        verify(restTemplate, never()).postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class));
        // Should NOT retry the create call (only the initial attempt).
        verify(restTemplate, times(1)).postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class));
    }

    private Order buildOrder() {
        User user = User.builder().id(1L).email("customer@test.com").name("Test User").build();
        Address address = Address.builder().id(1L).user(user)
                .fullName("Test User").phone("9876543210").street("123 Main St")
                .addressLine2("Apt 4").city("Mumbai").state("Maharashtra")
                .pincode("400001").build();
        Product product = Product.builder().id(1L).name("Cashews").price(new BigDecimal("899.00"))
                .stock(100).weight("500g").build();
        OrderItem item = OrderItem.builder().id(1L).product(product).quantity(2)
                .price(new BigDecimal("899.00")).build();
        Order order = Order.builder().id(1L).user(user).shippingAddress(address)
                .totalAmount(new BigDecimal("1798.00")).status(Order.OrderStatus.PAID)
                .items(new ArrayList<>(List.of(item))).build();
        order.setCreatedAt(LocalDateTime.now());
        return order;
    }
}
