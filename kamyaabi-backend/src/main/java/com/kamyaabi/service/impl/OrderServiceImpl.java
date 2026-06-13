package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.OrderRequest;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.entity.*;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.OrderMapper;
import com.kamyaabi.repository.*;
import com.kamyaabi.service.CartService;
import com.kamyaabi.service.CouponService;
import com.kamyaabi.service.OrderService;
import com.kamyaabi.service.ShiprocketService;
import com.kamyaabi.dto.response.CouponValidationResponse;
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
    private final CouponService couponService;
    private final OrderEventPublisher orderEventPublisher;
    private final ShiprocketService shiprocketService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            CartRepository cartRepository,
                            AddressRepository addressRepository,
                            UserRepository userRepository,
                            ProductRepository productRepository,
                            OrderMapper orderMapper,
                            CartService cartService,
                            CouponService couponService,
                            OrderEventPublisher orderEventPublisher,
                            ShiprocketService shiprocketService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderMapper = orderMapper;
        this.cartService = cartService;
        this.couponService = couponService;
        this.orderEventPublisher = orderEventPublisher;
        this.shiprocketService = shiprocketService;
    }

    @Override
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        log.info("Creating order for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Address address = addressRepository.findById(request.shippingAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", request.shippingAddressId()));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        Order.PaymentMethod paymentMethod = request.paymentMethod() != null
                ? request.paymentMethod() : Order.PaymentMethod.PREPAID;
        boolean isCod = paymentMethod == Order.PaymentMethod.COD;

        Order order = Order.builder()
                .user(user)
                .shippingAddress(address)
                .paymentMethod(paymentMethod)
                .status(isCod ? Order.OrderStatus.CONFIRMED : Order.OrderStatus.PENDING)
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
                    .weightKg(parseWeightKg(product.getWeight(), product.getUnit()))
                    .build();

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(effectivePrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        // COD orders are confirmed at creation — deduct stock immediately (mirrors
        // what updateOrderStatus does when an admin confirms a prepaid order).
        if (isCod) {
            for (OrderItem orderItem : orderItems) {
                Product product = orderItem.getProduct();
                int newStock = product.getStock() - orderItem.getQuantity();
                if (newStock < 0) {
                    log.warn("Stock would go negative on COD order for product {} (current: {}, ordered: {}) — clamping to 0",
                            product.getId(), product.getStock(), orderItem.getQuantity());
                    newStock = 0;
                }
                product.setStock(newStock);
                productRepository.save(product);
            }
        }

        // Apply coupon if provided
        if (request.couponCode() != null && !request.couponCode().isBlank()) {
            CouponValidationResponse couponResult = couponService.applyCoupon(
                    request.couponCode(), userId, null, totalAmount);
            if (couponResult.valid()) {
                order.setCouponCode(couponResult.code());
                order.setDiscountAmount(couponResult.discountAmount());
                order.setTotalAmount(totalAmount.subtract(couponResult.discountAmount()));
            } else {
                throw new BadRequestException(couponResult.message());
            }
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order created with id: {} (paymentMethod={})", savedOrder.getId(), paymentMethod);

        cartService.clearCart(userId);

        if (isCod) {
            log.info("Order {} placed via COD — publishing COD_ORDER_PLACED event", savedOrder.getId());
            orderEventPublisher.publishOrderEvent(savedOrder, OrderEventType.COD_ORDER_PLACED);
        } else {
            log.info("Order {} created successfully. Awaiting payment before sending notifications.", savedOrder.getId());
        }

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
    public Page<OrderResponse> getOrders(String statusFilter, Pageable pageable) {
        List<Order.OrderStatus> statuses = parseStatuses(statusFilter);
        return switch (statuses.size()) {
            case 0 -> getAllOrders(pageable);
            case 1 -> getOrdersByStatus(statuses.get(0), pageable);
            default -> getOrdersByStatuses(statuses, pageable);
        };
    }

    private List<Order.OrderStatus> parseStatuses(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) {
            return List.of();
        }
        List<Order.OrderStatus> statuses = new ArrayList<>();
        for (String part : statusFilter.split(",")) {
            try {
                statuses.add(Order.OrderStatus.valueOf(part.trim().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        return statuses;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByStatus(Order.OrderStatus status, Pageable pageable) {
        log.debug("Fetching orders with status: {}", status);
        return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrdersByStatuses(java.util.List<Order.OrderStatus> statuses, Pageable pageable) {
        log.debug("Fetching orders with statuses: {}", statuses);
        return orderRepository.findByStatusInOrderByCreatedAtDesc(statuses, pageable)
                .map(orderMapper::toResponse);
    }

    @Override
    public OrderResponse updateOrderStatus(Long orderId, Order.OrderStatus status) {
        log.info("Updating order {} status to: {}", orderId, status);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        Order.OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);

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

        if (status == Order.OrderStatus.CANCELLED && order.getShiprocketOrderId() != null) {
            try {
                shiprocketService.cancelShiprocketOrder(order);
            } catch (Exception e) {
                log.error("Failed to cancel Shiprocket order for order {}: {}", orderId, e.getMessage());
            }
        }

        Order saved = orderRepository.save(order);
        log.info("Order {} status updated from {} to {}", orderId, previousStatus, status);

        OrderEventType eventType = mapStatusToEventType(status);
        orderEventPublisher.publishOrderEvent(saved, eventType);

        return orderMapper.toResponse(saved);
    }

    static BigDecimal parseWeightKg(String weight, String unit) {
        if (weight == null || weight.isBlank()) return null;
        try {
            BigDecimal value = new BigDecimal(weight.trim());
            if (unit != null && unit.trim().toLowerCase().startsWith("g")
                    && !unit.trim().toLowerCase().startsWith("kg")) {
                return value.divide(BigDecimal.valueOf(1000), 3, java.math.RoundingMode.HALF_UP);
            }
            return value;
        } catch (NumberFormatException e) {
            return null;
        }
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
