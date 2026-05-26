package com.kamyaabi.controller;

import com.kamyaabi.entity.Order;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.ShiprocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShippingControllerTest {

    @Mock private ShiprocketService shiprocketService;
    @Mock private OrderRepository orderRepository;

    private ShippingController controller;

    @BeforeEach
    void setUp() {
        controller = new ShippingController(shiprocketService, orderRepository);
    }

    @Test
    void trackOrder_orderNotFound_throwsException() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.trackOrder(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void trackOrder_noAwbNumber_throwsBadRequest() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.PAID)
                .items(new ArrayList<>())
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> controller.trackOrder(1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void trackOrder_withAwb_returnsTrackingData() {
        Order order = Order.builder().id(1L)
                .totalAmount(new BigDecimal("100.00"))
                .status(Order.OrderStatus.SHIPPED)
                .awbNumber("AWB123")
                .items(new ArrayList<>())
                .build();

        Map<String, Object> trackingData = Map.of("status", "in_transit");
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(shiprocketService.trackShipment("AWB123")).thenReturn(trackingData);

        var response = controller.trackOrder(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().data()).containsEntry("status", "in_transit");
    }
}
