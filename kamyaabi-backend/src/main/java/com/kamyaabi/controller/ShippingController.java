package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.PincodeServiceabilityResponse;
import com.kamyaabi.dto.response.PublicOrderTrackingResponse;
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
@Tag(name = "Shipping", description = "Shipment tracking endpoints (public, no auth required)")
public class ShippingController {

    private final ShiprocketService shiprocketService;
    private final OrderRepository orderRepository;

    public ShippingController(ShiprocketService shiprocketService,
                              OrderRepository orderRepository) {
        this.shiprocketService = shiprocketService;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/track/{orderId}")
    @Operation(summary = "Track shipment by order ID",
            description = "Get real-time tracking info for an order's shipment. No authentication required.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trackOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (order.getAwbNumber() == null || order.getAwbNumber().isBlank()) {
            throw new BadRequestException("Shipment tracking not available yet for this order");
        }

        Map<String, Object> tracking = shiprocketService.trackShipment(order.getAwbNumber());
        return ResponseEntity.ok(ApiResponse.success(tracking));
    }

    @GetMapping("/track")
    @Operation(summary = "Track shipment by AWB code",
            description = "Get real-time tracking info using an AWB/tracking number. No authentication required.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trackByAwb(@RequestParam String awb) {
        if (awb == null || awb.isBlank()) {
            throw new BadRequestException("AWB code is required");
        }

        Order order = orderRepository.findByAwbNumber(awb)
                .orElseThrow(() -> new ResourceNotFoundException("No order found for AWB: " + awb));

        Map<String, Object> tracking = shiprocketService.trackShipment(order.getAwbNumber());
        return ResponseEntity.ok(ApiResponse.success(tracking));
    }

    @GetMapping("/track/status/{orderId}")
    @Operation(summary = "Public order tracking status",
            description = "Returns order lifecycle status and Shiprocket tracking data if available. No authentication required.")
    public ResponseEntity<ApiResponse<PublicOrderTrackingResponse>> getPublicOrderStatus(
            @PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(buildPublicTracking(
                orderRepository.findById(orderId)
                        .orElseThrow(() -> new ResourceNotFoundException("Order", orderId)))));
    }

    @GetMapping("/track/status")
    @Operation(summary = "Public order tracking status by AWB",
            description = "Returns order lifecycle status by AWB/tracking number. No authentication required.")
    public ResponseEntity<ApiResponse<PublicOrderTrackingResponse>> getPublicOrderStatusByAwb(
            @RequestParam String awb) {
        if (awb == null || awb.isBlank()) {
            throw new BadRequestException("AWB code is required");
        }
        return ResponseEntity.ok(ApiResponse.success(buildPublicTracking(
                orderRepository.findByAwbNumber(awb)
                        .orElseThrow(() -> new ResourceNotFoundException("No order found for AWB: " + awb)))));
    }

    @GetMapping("/serviceability")
    @Operation(summary = "Check pincode serviceability",
            description = "Check if delivery is available to the given pincode via Shiprocket. No authentication required.")
    public ResponseEntity<ApiResponse<PincodeServiceabilityResponse>> checkServiceability(
            @RequestParam String pincode,
            @RequestParam(defaultValue = "0.5") double weight) {
        if (pincode == null || !pincode.matches("^[1-9][0-9]{5}$")) {
            throw new BadRequestException("Please enter a valid 6-digit pincode");
        }
        return ResponseEntity.ok(ApiResponse.success(shiprocketService.checkServiceability(pincode, weight)));
    }

    private PublicOrderTrackingResponse buildPublicTracking(Order order) {
        PublicOrderTrackingResponse.PublicOrderTrackingResponseBuilder builder =
                PublicOrderTrackingResponse.builder()
                        .orderId(order.getId())
                        .orderStatus(order.getStatus().name())
                        .shippingStatus(order.getShippingStatus())
                        .awbNumber(order.getAwbNumber())
                        .courierName(order.getCourierName())
                        .placedAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null)
                        .deliveredAt(order.getDeliveredAt() != null ? order.getDeliveredAt().toString() : null);

        if (order.getAwbNumber() != null && !order.getAwbNumber().isBlank()) {
            try {
                builder.trackingData(shiprocketService.trackShipment(order.getAwbNumber()));
            } catch (Exception e) {
                log.warn("Failed to fetch Shiprocket tracking for order {}: {}",
                        order.getId(), e.getMessage());
            }
        }
        return builder.build();
    }
}
