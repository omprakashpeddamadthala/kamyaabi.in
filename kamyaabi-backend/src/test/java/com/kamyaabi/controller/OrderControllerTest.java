package com.kamyaabi.controller;

import com.kamyaabi.dto.request.OrderRequest;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock private OrderService orderService;
    @Mock private CurrentUser currentUser;

    @InjectMocks private OrderController orderController;

    private final OrderResponse orderResponse = OrderResponse.builder()
            .id(1L).totalAmount(new BigDecimal("1498.00")).status("PENDING").build();

    @Test
    void createOrder_shouldReturnOrder() {
        OrderRequest request = OrderRequest.builder().shippingAddressId(1L).build();
        when(currentUser.getUserId()).thenReturn(1L);
        when(orderService.createOrder(1L, request)).thenReturn(orderResponse);

        ResponseEntity<?> response = orderController.createOrder(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getUserOrders_shouldReturnPage() {
        Page<OrderResponse> page = new PageImpl<>(List.of(orderResponse));
        when(currentUser.getUserId()).thenReturn(1L);
        when(orderService.getUserOrders(any(Long.class), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = orderController.getUserOrders(0, 10);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getOrderById_shouldReturnOrder() {
        when(orderService.getOrderById(1L)).thenReturn(orderResponse);

        ResponseEntity<?> response = orderController.getOrderById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
