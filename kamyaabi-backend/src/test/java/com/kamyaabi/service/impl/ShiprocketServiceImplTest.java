package com.kamyaabi.service.impl;

import com.kamyaabi.config.ShiprocketProperties;
import com.kamyaabi.entity.*;
import com.kamyaabi.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
        properties.setEmail("test@example.com");
        properties.setPassword("testpassword");
        properties.setPickupLocation("Primary Warehouse");
        properties.setDefaultWeight(0.5);
        properties.setDefaultLength(10);
        properties.setDefaultBreadth(10);
        properties.setDefaultHeight(10);

        shiprocketService = new ShiprocketServiceImpl(properties, orderRepository);
        // Inject the mocked RestTemplate via reflection
        try {
            java.lang.reflect.Field field = ShiprocketServiceImpl.class.getDeclaredField("restTemplate");
            field.setAccessible(true);
            field.set(shiprocketService, restTemplate);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void isConfigured_whenCredentialsSet_returnsTrue() {
        assertThat(shiprocketService.isConfigured()).isTrue();
    }

    @Test
    void isConfigured_whenEmailBlank_returnsFalse() {
        properties.setEmail("");
        assertThat(shiprocketService.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_whenPasswordBlank_returnsFalse() {
        properties.setPassword("");
        assertThat(shiprocketService.isConfigured()).isFalse();
    }

    @Test
    void syncOrderToShiprocket_whenNotConfigured_skips() {
        properties.setEmail("");
        Order order = buildOrder();
        shiprocketService.syncOrderToShiprocket(order);
        verifyNoInteractions(restTemplate);
        verifyNoInteractions(orderRepository);
    }

    @Test
    @SuppressWarnings("unchecked")
    void syncOrderToShiprocket_success_setsFieldsAndSaves() {
        Order order = buildOrder();

        // Mock auth
        Map<String, Object> authResponse = new HashMap<>();
        authResponse.put("token", "test-token-123");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(authResponse));

        // Mock create order
        Map<String, Object> createResponse = new HashMap<>();
        createResponse.put("order_id", 12345);
        createResponse.put("shipment_id", 67890);
        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(createResponse));

        // Mock assign AWB
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

        // Mock pickup
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

        // Mock auth
        Map<String, Object> authResponse = new HashMap<>();
        authResponse.put("token", "test-token-123");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(authResponse));

        // Mock create order - throws exception
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

        // Mock auth
        Map<String, Object> authResponse = new HashMap<>();
        authResponse.put("token", "test-token-123");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(authResponse));

        // Mock cancel
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
        properties.setEmail("");
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
        // Mock auth
        Map<String, Object> authResponse = new HashMap<>();
        authResponse.put("token", "test-token-123");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(authResponse));

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
        // Mock auth
        Map<String, Object> authResponse = new HashMap<>();
        authResponse.put("token", "test-token-123");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(authResponse));

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
        properties.setEmail("");
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

        Map<String, Object> authResponse = new HashMap<>();
        authResponse.put("token", "test-token-123");
        when(restTemplate.postForEntity(
                contains("/auth/login"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(authResponse));

        Map<String, Object> createResponse = new HashMap<>();
        createResponse.put("order_id", 12345);
        createResponse.put("shipment_id", 67890);
        when(restTemplate.postForEntity(
                contains("/orders/create/adhoc"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenReturn(ResponseEntity.ok(createResponse));

        // AWB fails
        when(restTemplate.postForEntity(
                contains("/courier/assign/awb"),
                any(HttpEntity.class),
                any(Class.class)))
                .thenThrow(new RuntimeException("AWB failure"));

        // Pickup also will fail since AWB failed but that's handled
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
