package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record WhatsappOtpRequestResponse(
        int resendAfterSeconds,
        int expiresInSeconds
) {
}
