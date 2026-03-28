package com.kamyaabi.service;

import com.kamyaabi.dto.request.OrderRequest;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(Long userId, OrderRequest request);
    OrderResponse getOrderById(Long orderId);
    Page<OrderResponse> getUserOrders(Long userId, Pageable pageable);
    Page<OrderResponse> getAllOrders(Pageable pageable);
    OrderResponse updateOrderStatus(Long orderId, Order.OrderStatus status);
}
