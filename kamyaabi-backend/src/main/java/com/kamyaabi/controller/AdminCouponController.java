package com.kamyaabi.controller;

import com.kamyaabi.dto.request.CouponRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.CouponResponse;
import com.kamyaabi.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/coupons")
@Tag(name = "Admin Coupons", description = "Admin coupon management endpoints")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    @Operation(summary = "List all coupons",
            description = "Paginated list of coupons with optional search and status filter.")
    public ResponseEntity<ApiResponse<Page<CouponResponse>>> listCoupons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active) {
        Sort sort = Sort.by("created_at").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CouponResponse> coupons = couponService.listCoupons(q, active, pageable);
        return ResponseEntity.ok(ApiResponse.success(coupons));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get coupon by id", description = "Returns a single coupon detail.")
    public ResponseEntity<ApiResponse<CouponResponse>> getCoupon(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(couponService.getCoupon(id)));
    }

    @PostMapping
    @Operation(summary = "Create coupon", description = "Create a new coupon (Admin only).")
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @Valid @RequestBody CouponRequest request) {
        CouponResponse coupon = couponService.createCoupon(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Coupon created", coupon));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update coupon", description = "Update an existing coupon (Admin only).")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        CouponResponse coupon = couponService.updateCoupon(id, request);
        return ResponseEntity.ok(ApiResponse.success("Coupon updated", coupon));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate coupon",
            description = "Soft-delete — sets is_active to false (Admin only).")
    public ResponseEntity<ApiResponse<Void>> deactivateCoupon(@PathVariable Long id) {
        couponService.deactivateCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deactivated", null));
    }
}
