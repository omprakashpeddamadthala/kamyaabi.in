package com.kamyaabi.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.Map;

/**
 * Standard error response body returned by {@code GlobalExceptionHandler} for every
 * exception path. The shape matches the refactor spec so clients and log aggregators
 * can rely on a single structure.
 *
 * <p>Field semantics:
 * <ul>
 *   <li>{@code timestamp} — ISO-8601 UTC instant the error was produced.</li>
 *   <li>{@code status} — HTTP status code (mirrors the response status line).</li>
 *   <li>{@code error} — short textual status reason (e.g. "Bad Request").</li>
 *   <li>{@code message} — human-readable, sanitized message safe for end users.</li>
 *   <li>{@code path} — request URI that produced the error.</li>
 *   <li>{@code traceId} — correlation id from MDC, echoed to the client via
 *       the {@code X-Correlation-Id} header and usable for log lookups.</li>
 *   <li>{@code fieldErrors} — optional map of field → message for 400 validation failures;
 *       omitted when null via {@link JsonInclude.Include#NON_NULL}.</li>
 * </ul>
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    @JsonFormat(shape = JsonFormat.Shape.STRING)
    Instant timestamp;

    int status;

    String error;

    String message;

    String path;

    String traceId;

    Map<String, String> fieldErrors;
}
