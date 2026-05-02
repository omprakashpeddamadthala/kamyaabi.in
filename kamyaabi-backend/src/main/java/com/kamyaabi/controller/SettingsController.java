package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Read-only public endpoint exposing the safe-for-anonymous subset of platform
 * settings (e.g. products per page, optional UI badges). Admin-only endpoints
 * for the full settings map live on {@link AdminController}.
 */
@RestController
@RequestMapping("/api/settings")
@Tag(name = "Settings", description = "Public read-only platform settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping("/public")
    @Operation(summary = "Public settings",
            description = "Returns the subset of settings safe for anonymous frontends "
                    + "(products_per_page, show_bought_recently_badge).")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPublicSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getPublicSettings()));
    }
}
