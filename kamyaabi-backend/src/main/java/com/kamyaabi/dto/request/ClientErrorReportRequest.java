package com.kamyaabi.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record ClientErrorReportRequest(
        @Size(max = 2_000) String message,
        @Size(max = 16_000) String stack,
        @Size(max = 16_000) String componentStack,
        @Size(max = 2_000) String url,
        @Size(max = 1_000) String userAgent,
        @Size(max = 100) String source,
        @Size(max = 100) String traceId
) {
}
