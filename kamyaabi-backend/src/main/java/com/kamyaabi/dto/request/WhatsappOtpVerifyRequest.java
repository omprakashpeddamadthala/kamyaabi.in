package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;

@Builder
public record WhatsappOtpVerifyRequest(
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$",
                message = "Phone number must be a valid E.164-style number")
        String phoneNumber,

        @NotBlank(message = "OTP is required")
        @Pattern(regexp = "^\\d{6}$", message = "OTP must be a 6-digit code")
        String otp
) {
}
