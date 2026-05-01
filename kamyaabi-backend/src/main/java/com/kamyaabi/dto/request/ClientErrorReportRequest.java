package com.kamyaabi.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientErrorReportRequest {

    @Size(max = 2_000)
    private String message;

    @Size(max = 16_000)
    private String stack;

    @Size(max = 16_000)
    private String componentStack;

    @Size(max = 2_000)
    private String url;

    @Size(max = 1_000)
    private String userAgent;

    @Size(max = 100)
    private String source;

    @Size(max = 100)
    private String traceId;
}
