package com.kamyaabi.controller;

import com.kamyaabi.entity.Order;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.ShiprocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShippingControllerTest {

    @Mock private ShiprocketService shiprocketService;
    @Mock private OrderRepository orderRepository;

    @InjectMocks private ShippingController controller;

    private Order order;

    @BeforeEach
    void setUp() {
        order = Order.builder().id(1L).awbNumber("AWB123").build();
    }

    @Test
    void trackOrder_shouldReturnTrackingData() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(shiprocketService.trackShipment("AWB123")).thenReturn(Map.of("status", "in_transit"));

        var response = controller.trackOrder(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data()).containsEntry("status", "in_transit");
    }

    @Test
    void trackOrder_orderNotFound_shouldThrow() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.trackOrder(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void trackOrder_noAwb_shouldThrow() {
        order.setAwbNumber(null);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> controller.trackOrder(1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void trackByAwb_shouldReturnTrackingData() {
        when(orderRepository.findByAwbNumber("AWB123")).thenReturn(Optional.of(order));
        when(shiprocketService.trackShipment("AWB123")).thenReturn(Map.of("status", "delivered"));

        var response = controller.trackByAwb("AWB123");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data()).containsEntry("status", "delivered");
    }

    @Test
    void trackByAwb_blankAwb_shouldThrow() {
        assertThatThrownBy(() -> controller.trackByAwb(""))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void trackByAwb_notFound_shouldThrow() {
        when(orderRepository.findByAwbNumber("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.trackByAwb("UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
