package com.kamyaabi.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload posted by the frontend's {@code ErrorBoundary} and global window
 * error handlers when an uncaught render/runtime error occurs.
 *
 * <p>The fields are deliberately permissive to accept whatever the browser
 * provides; the server enforces only sane upper bounds so a malicious or
 * runaway client can't push huge payloads through to email.
 */
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

    /** Origin of the report — e.g. "react-error-boundary", "window.onerror", "unhandledrejection". */
    @Size(max = 100)
    private String source;

    /** Optional correlation id for cross-stack tracing. */
    @Size(max = 100)
    private String traceId;
}
