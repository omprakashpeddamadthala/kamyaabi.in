package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record OrderResponse(
        Long id,
        List<OrderItemResponse> items,
        BigDecimal totalAmount,
        BigDecimal totalWeightKg,
        String status,
        String paymentMethod,
        AddressResponse shippingAddress,
        PaymentResponse payment,
        String shiprocketOrderId,
        String shiprocketShipmentId,
        String awbNumber,
        String courierName,
        String shippingStatus,
        LocalDateTime pickupScheduledAt,
        LocalDateTime deliveredAt,
        Boolean shiprocketSynced,
        String couponCode,
        BigDecimal discountAmount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
