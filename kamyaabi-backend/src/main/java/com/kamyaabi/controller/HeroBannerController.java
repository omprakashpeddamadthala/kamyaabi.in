package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.HeroBannerResponse;
import com.kamyaabi.service.HeroBannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public read-only endpoint returning the active homepage hero banners in
 * display order. Admin CRUD lives on {@code AdminHeroBannerController}.
 */
@RestController
@RequestMapping("/api/hero-banners")
@Tag(name = "Hero Banners", description = "Public homepage hero banners")
public class HeroBannerController {

    private final HeroBannerService heroBannerService;

    public HeroBannerController(HeroBannerService heroBannerService) {
        this.heroBannerService = heroBannerService;
    }

    @GetMapping
    @Operation(summary = "Active hero banners",
            description = "Returns active homepage hero banners ordered by display order.")
    public ResponseEntity<ApiResponse<List<HeroBannerResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(heroBannerService.listActive()));
    }
}
