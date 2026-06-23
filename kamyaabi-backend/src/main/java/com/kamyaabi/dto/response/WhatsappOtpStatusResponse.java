package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record WhatsappOtpStatusResponse(
        boolean enabled
) {
}
