package com.kamyaabi.controller;

import com.kamyaabi.dto.request.HeroBannerRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.HeroBannerResponse;
import com.kamyaabi.service.HeroBannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Admin CRUD for homepage hero banners — upload images, set order/priority,
 * enable/disable, and edit alt text + link URL.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/hero-banners")
@Tag(name = "Admin Hero Banners", description = "Manage homepage hero banners (Admin only)")
public class AdminHeroBannerController {

    private final HeroBannerService heroBannerService;

    public AdminHeroBannerController(HeroBannerService heroBannerService) {
        this.heroBannerService = heroBannerService;
    }

    @GetMapping
    @Operation(summary = "List hero banners",
            description = "All hero banners (active + inactive) ordered by display order.")
    public ResponseEntity<ApiResponse<List<HeroBannerResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(heroBannerService.listAll()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create hero banner",
            description = "Create a banner with an uploaded image. Send a `banner` JSON part "
                    + "and an `image` file part.")
    public ResponseEntity<ApiResponse<HeroBannerResponse>> create(
            @Valid @RequestPart("banner") HeroBannerRequest request,
            @RequestPart("image") MultipartFile image) {
        HeroBannerResponse created = heroBannerService.create(request, image);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Hero banner created", created));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update hero banner",
            description = "Update banner metadata; optionally replace the image with a new `image` file part.")
    public ResponseEntity<ApiResponse<HeroBannerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestPart("banner") HeroBannerRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(
                ApiResponse.success("Hero banner updated", heroBannerService.update(id, request, image)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle hero banner status",
            description = "Enable or disable a banner without re-uploading the image.")
    public ResponseEntity<ApiResponse<HeroBannerResponse>> setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        return ResponseEntity.ok(
                ApiResponse.success("Hero banner status updated", heroBannerService.setActive(id, active)));
    }

    @PutMapping("/reorder")
    @Operation(summary = "Reorder hero banners",
            description = "Persist a new ordering given banner ids in the desired order.")
    public ResponseEntity<ApiResponse<List<HeroBannerResponse>>> reorder(
            @RequestBody Map<String, List<Long>> body) {
        return ResponseEntity.ok(
                ApiResponse.success("Hero banners reordered", heroBannerService.reorder(body.get("orderedIds"))));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete hero banner", description = "Permanently remove a hero banner.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        heroBannerService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Hero banner deleted", null));
    }
}
