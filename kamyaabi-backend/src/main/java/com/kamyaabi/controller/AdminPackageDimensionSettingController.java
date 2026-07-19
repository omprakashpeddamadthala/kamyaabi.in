package com.kamyaabi.controller;

import com.kamyaabi.dto.request.PackageDimensionSettingRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.PackageDimensionSettingResponse;
import com.kamyaabi.service.PackageDimensionSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/package-dimension-settings")
@RequiredArgsConstructor
@Tag(name = "Admin Package Dimension Settings", description = "Admin endpoints to manage package dimension settings")
public class AdminPackageDimensionSettingController {

    private final PackageDimensionSettingService service;

    @GetMapping
    @Operation(summary = "List all package dimension settings",
            description = "Get a list of all configured package weight slabs and their dimensions.")
    public ResponseEntity<ApiResponse<List<PackageDimensionSettingResponse>>> getAllSettings() {
        List<PackageDimensionSettingResponse> settings = service.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get package dimension setting by id",
            description = "Returns a single package dimension setting.")
    public ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> getSetting(@PathVariable Long id) {
        PackageDimensionSettingResponse setting = service.getSettingById(id);
        return ResponseEntity.ok(ApiResponse.success(setting));
    }

    @PostMapping
    @Operation(summary = "Create package dimension setting",
            description = "Create a new package weight slab and dimensions configuration.")
    public ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> createSetting(
            @Valid @RequestBody PackageDimensionSettingRequest request) {
        PackageDimensionSettingResponse setting = service.createSetting(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Package dimension setting created successfully", setting));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update package dimension setting",
            description = "Update an existing package weight slab and dimensions configuration.")
    public ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> updateSetting(
            @PathVariable Long id,
            @Valid @RequestBody PackageDimensionSettingRequest request) {
        PackageDimensionSettingResponse setting = service.updateSetting(id, request);
        return ResponseEntity.ok(ApiResponse.success("Package dimension setting updated successfully", setting));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete package dimension setting",
            description = "Permanently remove a package weight slab configuration.")
    public ResponseEntity<ApiResponse<Void>> deleteSetting(@PathVariable Long id) {
        service.deleteSetting(id);
        return ResponseEntity.ok(ApiResponse.success("Package dimension setting deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle package dimension setting status",
            description = "Enable or disable a package weight slab configuration.")
    public ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        PackageDimensionSettingResponse setting = service.updateStatus(id, active);
        return ResponseEntity.ok(ApiResponse.success("Package dimension setting status updated successfully", setting));
    }
}
