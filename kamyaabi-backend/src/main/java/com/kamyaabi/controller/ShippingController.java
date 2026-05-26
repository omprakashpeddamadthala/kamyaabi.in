package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.ShiprocketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/shipping")
@Tag(name = "Shipping", description = "Shipment tracking endpoints")
public class ShippingController {

    private final ShiprocketService shiprocketService;
    private final OrderRepository orderRepository;

    public ShippingController(ShiprocketService shiprocketService,
                              OrderRepository orderRepository) {
        this.shiprocketService = shiprocketService;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/track/{orderId}")
    @Operation(summary = "Track shipment", description = "Get real-time tracking info for an order's shipment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trackOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (order.getAwbNumber() == null || order.getAwbNumber().isBlank()) {
            throw new BadRequestException("Shipment tracking not available yet for this order");
        }

        Map<String, Object> tracking = shiprocketService.trackShipment(order.getAwbNumber());
        return ResponseEntity.ok(ApiResponse.success(tracking));
    }
}
