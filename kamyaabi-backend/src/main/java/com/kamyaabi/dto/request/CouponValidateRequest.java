package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record CouponValidateRequest(
        @NotBlank(message = "Coupon code is required")
        String code
) {
}
