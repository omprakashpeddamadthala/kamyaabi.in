package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record OrderRequest(
        @NotNull(message = "Shipping address ID is required")
        Long shippingAddressId
) {
}
