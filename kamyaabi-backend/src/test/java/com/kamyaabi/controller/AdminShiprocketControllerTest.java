package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.dto.response.ShiprocketStatsResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.OrderMapper;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.ShiprocketService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminShiprocketControllerTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderMapper orderMapper;
    @Mock private ShiprocketService shiprocketService;

    @InjectMocks private AdminShiprocketController controller;

    @Test
    void getStats_aggregatesCountsFromRepository() {
        when(orderRepository.countByShiprocketSyncedTrue()).thenReturn(12L);
        when(orderRepository.countByShiprocketSyncedFalseAndStatusIn(anyList())).thenReturn(3L);
        when(orderRepository.countByShippingStatus("PICKUP_SCHEDULED")).thenReturn(2L);
        when(orderRepository.countByShippingStatus("AWB_ASSIGNED")).thenReturn(4L);
        when(orderRepository.countByShippingStatus("IN TRANSIT")).thenReturn(5L);
        when(orderRepository.countByShippingStatus("OUT_FOR_DELIVERY")).thenReturn(1L);
        when(orderRepository.countByShippingStatus("OUT FOR DELIVERY")).thenReturn(0L);
        when(orderRepository.countByShippingStatus("SHIPPED")).thenReturn(0L);
        when(orderRepository.countByStatus(Order.OrderStatus.DELIVERED)).thenReturn(7L);
        when(orderRepository.countByStatus(Order.OrderStatus.CANCELLED)).thenReturn(1L);
        when(orderRepository.countByPaymentMethod(Order.PaymentMethod.COD)).thenReturn(6L);
        when(shiprocketService.isConfigured()).thenReturn(true);

        ResponseEntity<ApiResponse<ShiprocketStatsResponse>> response = controller.getStats();

        ShiprocketStatsResponse stats = response.getBody().data();
        assertThat(stats.totalSynced()).isEqualTo(12);
        assertThat(stats.syncPending()).isEqualTo(3);
        assertThat(stats.pickupScheduled()).isEqualTo(2);
        assertThat(stats.awbAssigned()).isEqualTo(4);
        assertThat(stats.inTransit()).isEqualTo(6);
        assertThat(stats.delivered()).isEqualTo(7);
        assertThat(stats.cancelled()).isEqualTo(1);
        assertThat(stats.codOrders()).isEqualTo(6);
        assertThat(stats.shiprocketConfigured()).isTrue();
    }

    @Test
    void listOrders_withoutFilter_returnsShippedOrders() {
        Order order = Order.builder().id(1L).status(Order.OrderStatus.PAID).build();
        Page<Order> page = new PageImpl<>(List.of(order));
        when(orderRepository.findByShiprocketOrderIdIsNotNullOrShippingStatusIsNotNull(any(Pageable.class)))
                .thenReturn(page);
        when(orderRepository.findAllWithDetailsByIdIn(List.of(1L))).thenReturn(List.of(order));
        when(orderMapper.toResponse(order)).thenReturn(OrderResponse.builder().id(1L).build());

        ResponseEntity<ApiResponse<Page<OrderResponse>>> response =
                controller.listOrders(0, 10, null);

        assertThat(response.getBody().data().getContent()).hasSize(1);
        verify(orderRepository, never())
                .findByPaymentMethodOrderByCreatedAtDesc(any(), any(Pageable.class));
    }

    @Test
    void listOrders_withCodFilter_callsPaymentMethodRepository() {
        when(orderRepository.findByPaymentMethodOrderByCreatedAtDesc(
                eq(Order.PaymentMethod.COD), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        controller.listOrders(0, 10, "COD");

        verify(orderRepository).findByPaymentMethodOrderByCreatedAtDesc(
                eq(Order.PaymentMethod.COD), any(Pageable.class));
    }

    @Test
    void listOrders_withInvalidPaymentMethod_throwsBadRequest() {
        assertThatThrownBy(() -> controller.listOrders(0, 10, "BITCOIN"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void syncOrder_orderNotFound_throws() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.syncOrder(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void syncOrder_shiprocketNotConfigured_throws() {
        Order order = Order.builder().id(1L).build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(shiprocketService.isConfigured()).thenReturn(false);

        assertThatThrownBy(() -> controller.syncOrder(1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void syncOrder_happyPath_invokesShiprocketSync() {
        Order order = Order.builder().id(1L).build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(shiprocketService.isConfigured()).thenReturn(true);
        when(orderRepository.findAllWithDetailsByIdIn(List.of(1L))).thenReturn(List.of(order));
        when(orderMapper.toResponse(order)).thenReturn(OrderResponse.builder().id(1L).build());

        ResponseEntity<ApiResponse<OrderResponse>> response = controller.syncOrder(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(shiprocketService).syncOrderToShiprocket(order);
    }

    @Test
    void track_withoutAwb_throws() {
        Order order = Order.builder().id(1L).awbNumber(null).build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> controller.track(1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void track_returnsTrackingPayload() {
        Order order = Order.builder().id(1L).awbNumber("AWB123").build();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(shiprocketService.trackShipment("AWB123")).thenReturn(Map.of("status", "IN_TRANSIT"));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = controller.track(1L);

        assertThat(response.getBody().data()).containsEntry("status", "IN_TRANSIT");
    }
}
