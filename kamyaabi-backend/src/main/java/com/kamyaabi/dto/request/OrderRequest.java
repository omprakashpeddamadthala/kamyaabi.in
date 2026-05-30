package com.kamyaabi.dto.request;

import com.kamyaabi.entity.Order;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record OrderRequest(
        @NotNull(message = "Shipping address ID is required")
        Long shippingAddressId,

        String couponCode,

        Order.PaymentMethod paymentMethod
) {
}
