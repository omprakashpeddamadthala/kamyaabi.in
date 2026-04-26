package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.OrderRequest;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.entity.*;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.OrderMapper;
import com.kamyaabi.repository.*;
import com.kamyaabi.service.CartService;
import com.kamyaabi.service.OrderService;
import com.kamyaabi.event.OrderEventPublisher;
import com.kamyaabi.event.OrderEventType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;
    private final CartService cartService;
    private final OrderEventPublisher orderEventPublisher;

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartRepository cartRepository,
                            AddressRepository addressRepository,
                            UserRepository userRepository,
                            ProductRepository productRepository,
                            OrderMapper orderMapper,
                            CartService cartService,
                            OrderEventPublisher orderEventPublisher) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderMapper = orderMapper;
        this.cartService = cartService;
        this.orderEventPublisher = orderEventPublisher;
    }

    @Override
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        log.info("Creating order for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Address address = addressRepository.findById(request.getShippingAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", request.getShippingAddressId()));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        Order order = Order.builder()
                .user(user)
                .shippingAddress(address)
                .status(Order.OrderStatus.PENDING)
                .build();

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            if (product.getStock() < cartItem.getQuantity()) {
                throw new BadRequestException(
                        "Insufficient stock for " + product.getName() + ". Available: " + product.getStock());
            }

            BigDecimal effectivePrice = product.getDiscountPrice() != null
                    ? product.getDiscountPrice() : product.getPrice();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .price(effectivePrice)
                    .build();

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(effectivePrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            // NOTE: Stock is NOT deducted here on order placement.
            // Stock deduction happens when admin sets status to CONFIRMED.
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        log.info("Order created with id: {}", savedOrder.getId());

        // Clear the cart
        cartService.clearCart(userId);

        // No email on order creation — emails are sent only after payment verification
        log.info("Order {} created successfully. Awaiting payment before sending notifications.", savedOrder.getId());

        return orderMapper.toResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        log.debug("Fetching order: {}", orderId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        log.debug("Fetching orders for user: {}", userId);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        log.debug("Fetching all orders");
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        log.debug("Fetching orders with status: {}", status);
        return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    public OrderResponse updateOrderStatus(Long orderId, Order.OrderStatus status) {
        log.info("Updating order {} status to: {}", orderId, status);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        Order.OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);

        // Phase 6: Deduct stock ONLY when admin confirms the order
        if (status == Order.OrderStatus.CONFIRMED && previousStatus != Order.OrderStatus.CONFIRMED) {
            log.info("Order {} confirmed by admin — deducting stock for {} items", orderId, order.getItems().size());
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                int newStock = product.getStock() - item.getQuantity();
                if (newStock < 0) {
                    log.warn("Stock would go negative for product {} (current: {}, ordered: {}) — clamping to 0",
                            product.getId(), product.getStock(), item.getQuantity());
                    newStock = 0;
                }
                product.setStock(newStock);
                productRepository.save(product);
                log.debug("Deducted {} units from product {} '{}'; remaining stock: {}",
                        item.getQuantity(), product.getId(), product.getName(), newStock);
            }
        }

        Order saved = orderRepository.save(order);
        log.info("Order {} status updated from {} to {}", orderId, previousStatus, status);

        // Skip email for PAID status set by admin — payment verification already handles this
        if (status == Order.OrderStatus.PAID) {
            log.info("Skipping email for admin PAID status update on order {} — payment verification handles this", orderId);
        } else {
            OrderEventType eventType = mapStatusToEventType(status);
            orderEventPublisher.publishOrderEvent(saved, eventType);
        }

        return orderMapper.toResponse(saved);
    }

    private OrderEventType mapStatusToEventType(Order.OrderStatus status) {
        return switch (status) {
            case PENDING -> OrderEventType.ORDER_PLACED;
            case PAID -> OrderEventType.PAYMENT_SUCCESS;
            case CONFIRMED -> OrderEventType.ORDER_CONFIRMED;
            case PROCESSING -> OrderEventType.ORDER_PROCESSING;
            case SHIPPED -> OrderEventType.ORDER_SHIPPED;
            case DELIVERED -> OrderEventType.ORDER_DELIVERED;
            case CANCELLED -> OrderEventType.ORDER_CANCELLED;
            case PAYMENT_FAILED -> OrderEventType.PAYMENT_FAILED;
        };
    }
}
