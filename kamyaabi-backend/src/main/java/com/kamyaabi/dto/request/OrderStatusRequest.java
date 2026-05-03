package com.kamyaabi.dto.request;

import com.kamyaabi.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record OrderStatusRequest(
        @NotNull(message = "Status is required")
        Order.OrderStatus status
) {
}
