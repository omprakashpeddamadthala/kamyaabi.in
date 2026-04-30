package com.kamyaabi.controller;

import com.kamyaabi.dto.request.ClientErrorReportRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.email.ErrorAlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sink for client-side error reports posted by the frontend's
 * {@code ErrorBoundary} (uncaught render/runtime errors) and global
 * {@code window.onerror} / {@code unhandledrejection} handlers.
 *
 * <p>Accepts the report, ack-200s immediately, and dispatches an async
 * developer alert email so a flaky mailer can never block or fail the
 * client. Mounted as a public endpoint because it must be reachable even
 * from anonymous sessions where the auth state is itself broken.
 */
@Slf4j
@RestController
@RequestMapping("/api/errors")
@Tag(name = "Error reporting", description = "Frontend error sink that fans out developer email alerts")
public class ErrorReportController {

    private final ErrorAlertService errorAlertService;

    public ErrorReportController(ErrorAlertService errorAlertService) {
        this.errorAlertService = errorAlertService;
    }

    @PostMapping("/report")
    @Operation(summary = "Report an uncaught client-side error",
            description = "Triggers a developer alert email. The response body never echoes the report contents.")
    public ResponseEntity<ApiResponse<Void>> report(@Valid @RequestBody ClientErrorReportRequest request) {
        log.warn("Frontend error report received: source={} url={} message={}",
                request.getSource(),
                request.getUrl(),
                truncate(request.getMessage(), 200));
        try {
            errorAlertService.alertOnFrontendException(
                    request.getMessage(),
                    request.getStack(),
                    request.getComponentStack(),
                    request.getUrl(),
                    request.getUserAgent(),
                    request.getSource(),
                    request.getTraceId());
        } catch (Exception alertFailure) {
            // The alert pipeline is async, but we still defensively swallow any
            // accidental synchronous failure so the client always sees a 200.
            log.error("Failed to dispatch frontend error alert: {}", alertFailure.getMessage());
        }
        // Body intentionally empty — never echo the report fields back to the
        // client to avoid leaking dev contact details or stack traces.
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("error report received")
                .build());
    }

    private static String truncate(String value, int max) {
        if (value == null) return "";
        return value.length() <= max ? value : value.substring(0, max) + "…";
    }
}
