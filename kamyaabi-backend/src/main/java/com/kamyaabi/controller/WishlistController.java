package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.WishlistResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/wishlist")
@Tag(name = "Wishlist", description = "Wishlist endpoints")
public class WishlistController {

    private final WishlistService wishlistService;
    private final CurrentUser currentUser;

    public WishlistController(WishlistService wishlistService, CurrentUser currentUser) {
        this.wishlistService = wishlistService;
        this.currentUser = currentUser;
    }

    @GetMapping
    @Operation(summary = "Get wishlist", description = "Get current user's wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> getWishlist() {
        WishlistResponse wishlist = wishlistService.getWishlist(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(wishlist));
    }

    @PostMapping("/items/{productId}")
    @PreAuthorize("!hasRole('ADMIN')")
    @Operation(summary = "Add item to wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> addItem(@PathVariable Long productId) {
        WishlistResponse wishlist = wishlistService.addItem(currentUser.getUserId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist", wishlist));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove item from wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> removeItem(@PathVariable Long productId) {
        WishlistResponse wishlist = wishlistService.removeItem(currentUser.getUserId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist", wishlist));
    }

    @GetMapping("/check/{productId}")
    @Operation(summary = "Check if product is in wishlist")
    public ResponseEntity<ApiResponse<Boolean>> isInWishlist(@PathVariable Long productId) {
        boolean inWishlist = wishlistService.isProductInWishlist(currentUser.getUserId(), productId);
        return ResponseEntity.ok(ApiResponse.success(inWishlist));
    }

    @GetMapping("/product-ids")
    @Operation(summary = "Get all wishlisted product IDs")
    public ResponseEntity<ApiResponse<Set<Long>>> getWishlistProductIds() {
        Set<Long> productIds = wishlistService.getWishlistProductIds(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(productIds));
    }
}
