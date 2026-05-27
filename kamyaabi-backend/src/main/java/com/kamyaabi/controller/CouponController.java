package com.kamyaabi.controller;

import com.kamyaabi.dto.request.CouponValidateRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.CouponResponse;
import com.kamyaabi.dto.response.CouponValidationResponse;
import com.kamyaabi.entity.Cart;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.repository.CartRepository;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/coupons")
@Tag(name = "Coupons", description = "Coupon validation and application endpoints")
public class CouponController {

    private final CouponService couponService;
    private final CurrentUser currentUser;
    private final CartRepository cartRepository;

    public CouponController(CouponService couponService,
                            CurrentUser currentUser,
                            CartRepository cartRepository) {
        this.couponService = couponService;
        this.currentUser = currentUser;
        this.cartRepository = cartRepository;
    }

    @GetMapping("/available")
    @Operation(summary = "List available coupons",
            description = "Returns all active, non-expired coupons that users can apply.")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getAvailableCoupons() {
        List<CouponResponse> coupons = couponService.getAvailableCoupons();
        return ResponseEntity.ok(ApiResponse.success(coupons));
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate coupon",
            description = "Dry-run validation — checks all restrictions without recording usage.")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @Valid @RequestBody CouponValidateRequest request) {
        Long userId = currentUser.getUserId();
        if (userId == null) {
            throw new BadRequestException("User must be authenticated to validate a coupon");
        }
        BigDecimal orderTotal = getCartTotal(userId);
        CouponValidationResponse result = couponService.validateCoupon(request.code(), userId, orderTotal);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/apply")
    @Operation(summary = "Apply coupon",
            description = "Apply a coupon code to the current session — records usage atomically.")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> applyCoupon(
            @Valid @RequestBody CouponValidateRequest request) {
        Long userId = currentUser.getUserId();
        if (userId == null) {
            throw new BadRequestException("User must be authenticated to apply a coupon");
        }
        BigDecimal orderTotal = getCartTotal(userId);
        CouponValidationResponse result = couponService.applyCoupon(request.code(), userId, null, orderTotal);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private BigDecimal getCartTotal(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart == null || cart.getItems().isEmpty()) {
            return BigDecimal.ZERO;
        }
        return cart.getItems().stream()
                .map(item -> {
                    BigDecimal price = item.getProduct().getDiscountPrice() != null
                            ? item.getProduct().getDiscountPrice()
                            : item.getProduct().getPrice();
                    return price.multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
