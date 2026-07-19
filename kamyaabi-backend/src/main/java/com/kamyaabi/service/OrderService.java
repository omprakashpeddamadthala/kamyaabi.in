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
    Page<OrderResponse> getOrders(String statusFilter, Pageable pageable);
    Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable);
    Page<OrderResponse> getOrdersByStatuses(java.util.List<Order.OrderStatus> statuses, Pageable pageable);
    OrderResponse updateOrderStatus(Long orderId, Order.OrderStatus status);

    /**
     * Triggers a live Shiprocket status refresh for the given order and
     * returns the updated {@link OrderResponse}.  If the order has no AWB
     * or Shiprocket is not configured, the current DB values are returned
     * unchanged.
     */
    OrderResponse refreshShipmentStatus(Long orderId);
}
