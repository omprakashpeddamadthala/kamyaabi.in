package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.OrderItemResponse;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.OrderItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class OrderMapper {

    private final AddressMapper addressMapper;
    private final PaymentMapper paymentMapper;

    public OrderMapper(AddressMapper addressMapper, PaymentMapper paymentMapper) {
        this.addressMapper = addressMapper;
        this.paymentMapper = paymentMapper;
    }

    public OrderResponse toResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        BigDecimal totalWeight = order.getItems().stream()
                .filter(i -> i.getWeightKg() != null)
                .map(i -> i.getWeightKg().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return OrderResponse.builder()
                .id(order.getId())
                .items(itemResponses)
                .totalAmount(order.getTotalAmount())
                .totalWeightKg(totalWeight.compareTo(BigDecimal.ZERO) == 0 ? null : totalWeight)
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod() != null
                        ? order.getPaymentMethod().name() : Order.PaymentMethod.PREPAID.name())
                .shippingAddress(order.getShippingAddress() != null
                        ? addressMapper.toResponse(order.getShippingAddress()) : null)
                .payment(order.getPayment() != null
                        ? paymentMapper.toResponse(order.getPayment()) : null)
                .shiprocketOrderId(order.getShiprocketOrderId())
                .shiprocketShipmentId(order.getShiprocketShipmentId())
                .awbNumber(order.getAwbNumber())
                .courierName(order.getCourierName())
                .shippingStatus(order.getShippingStatus())
                .pickupScheduledAt(order.getPickupScheduledAt())
                .deliveredAt(order.getDeliveredAt())
                .shiprocketSynced(order.getShiprocketSynced())
                .couponCode(order.getCouponCode())
                .discountAmount(order.getDiscountAmount())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    public OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productImageUrl(item.getProduct().getImageUrl())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .subtotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .weightKg(item.getWeightKg())
                .build();
    }
}
