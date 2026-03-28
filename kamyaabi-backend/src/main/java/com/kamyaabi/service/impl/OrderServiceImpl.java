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

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartRepository cartRepository,
                            AddressRepository addressRepository,
                            UserRepository userRepository,
                            ProductRepository productRepository,
                            OrderMapper orderMapper,
                            CartService cartService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderMapper = orderMapper;
        this.cartService = cartService;
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

            // Reduce stock
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        log.info("Order created with id: {}", savedOrder.getId());

        // Clear the cart
        cartService.clearCart(userId);

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
    public OrderResponse updateOrderStatus(Long orderId, Order.OrderStatus status) {
        log.info("Updating order {} status to: {}", orderId, status);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        order.setStatus(status);
        Order saved = orderRepository.save(order);
        log.info("Order {} status updated to: {}", orderId, status);
        return orderMapper.toResponse(saved);
    }
}
