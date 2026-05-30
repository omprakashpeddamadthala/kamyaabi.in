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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only endpoints for monitoring and managing the Shiprocket integration.
 * Authorisation is enforced by {@code SecurityConfig} for everything under
 * {@code /api/admin/**} — only users with role {@code ADMIN} can hit these.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/shiprocket")
@Tag(name = "Admin Shiprocket", description = "Admin Shiprocket dashboard endpoints")
public class AdminShiprocketController {

    private static final List<Order.OrderStatus> SYNCABLE_STATUSES = List.of(
            Order.OrderStatus.PAID, Order.OrderStatus.CONFIRMED);

    private static final List<String> IN_TRANSIT_STATUSES = List.of(
            "IN TRANSIT", "OUT_FOR_DELIVERY", "OUT FOR DELIVERY", "SHIPPED");

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final ShiprocketService shiprocketService;

    public AdminShiprocketController(OrderRepository orderRepository,
                                     OrderMapper orderMapper,
                                     ShiprocketService shiprocketService) {
        this.orderRepository = orderRepository;
        this.orderMapper = orderMapper;
        this.shiprocketService = shiprocketService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Shiprocket dashboard stats",
            description = "Aggregated counts of orders by Shiprocket lifecycle stage")
    public ResponseEntity<ApiResponse<ShiprocketStatsResponse>> getStats() {
        long totalSynced = orderRepository.countByShiprocketSyncedTrue();
        long syncPending = orderRepository.countByShiprocketSyncedFalseAndStatusIn(SYNCABLE_STATUSES);

        long pickupScheduled = orderRepository.countByShippingStatus("PICKUP_SCHEDULED");
        long awbAssigned = orderRepository.countByShippingStatus("AWB_ASSIGNED");

        long inTransit = 0;
        for (String s : IN_TRANSIT_STATUSES) {
            inTransit += orderRepository.countByShippingStatus(s);
        }

        long delivered = orderRepository.countByStatus(Order.OrderStatus.DELIVERED);
        long cancelled = orderRepository.countByStatus(Order.OrderStatus.CANCELLED);
        long codOrders = orderRepository.countByPaymentMethod(Order.PaymentMethod.COD);

        ShiprocketStatsResponse stats = ShiprocketStatsResponse.builder()
                .totalSynced(totalSynced)
                .syncPending(syncPending)
                .pickupScheduled(pickupScheduled)
                .awbAssigned(awbAssigned)
                .inTransit(inTransit)
                .delivered(delivered)
                .cancelled(cancelled)
                .codOrders(codOrders)
                .shiprocketConfigured(shiprocketService.isConfigured())
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/orders")
    @Operation(summary = "Orders synced (or pending sync) to Shiprocket",
            description = "Paginated list of orders that have shipping information or are awaiting sync, "
                    + "newest first. Optionally filter to COD-only via paymentMethod=COD.")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String paymentMethod) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders;
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            Order.PaymentMethod method;
            try {
                method = Order.PaymentMethod.valueOf(paymentMethod.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Unknown paymentMethod: " + paymentMethod);
            }
            orders = orderRepository.findByPaymentMethodOrderByCreatedAtDesc(method, pageable);
        } else {
            orders = orderRepository.findByShiprocketOrderIdIsNotNullOrShippingStatusIsNotNull(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(orders.map(orderMapper::toResponse)));
    }

    @PostMapping("/sync/{orderId}")
    @Operation(summary = "Manually trigger Shiprocket sync",
            description = "Force a re-sync of the given order to Shiprocket. Useful when the automatic "
                    + "background retry hasn't picked up a failed order yet.")
    public ResponseEntity<ApiResponse<OrderResponse>> syncOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (!shiprocketService.isConfigured()) {
            throw new BadRequestException("Shiprocket is not configured on this environment");
        }

        log.info("Admin-triggered Shiprocket sync for order {}", orderId);
        shiprocketService.syncOrderToShiprocket(order);

        Order refreshed = orderRepository.findById(orderId).orElse(order);
        return ResponseEntity.ok(ApiResponse.success("Shiprocket sync triggered", orderMapper.toResponse(refreshed)));
    }

    @GetMapping("/track/{orderId}")
    @Operation(summary = "Track shipment (admin)",
            description = "Returns the raw Shiprocket tracking payload for the given order. "
                    + "Requires the order to have an AWB number assigned.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> track(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (order.getAwbNumber() == null || order.getAwbNumber().isBlank()) {
            throw new BadRequestException("Shipment tracking not available yet for this order");
        }

        Map<String, Object> tracking = shiprocketService.trackShipment(order.getAwbNumber());
        return ResponseEntity.ok(ApiResponse.success(tracking));
    }
}
