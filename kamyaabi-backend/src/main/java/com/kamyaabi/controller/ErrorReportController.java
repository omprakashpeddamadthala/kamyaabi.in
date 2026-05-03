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
                request.source(),
                request.url(),
                truncate(request.message(), 200));
        try {
            errorAlertService.alertOnFrontendException(
                    request.message(),
                    request.stack(),
                    request.componentStack(),
                    request.url(),
                    request.userAgent(),
                    request.source(),
                    request.traceId());
        } catch (Exception alertFailure) {
            log.error("Failed to dispatch frontend error alert: {}", alertFailure.getMessage());
        }
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
