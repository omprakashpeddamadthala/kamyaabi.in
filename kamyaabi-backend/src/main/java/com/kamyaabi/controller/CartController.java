package com.kamyaabi.controller;

import com.kamyaabi.dto.request.CartItemRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.CartResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/cart")
@Tag(name = "Cart", description = "Shopping cart endpoints")
public class CartController {

    private final CartService cartService;
    private final CurrentUser currentUser;

    public CartController(CartService cartService, CurrentUser currentUser) {
        this.cartService = cartService;
        this.currentUser = currentUser;
    }

    @GetMapping
    @Operation(summary = "Get cart", description = "Get current user's shopping cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        CartResponse cart = cartService.getCart(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart", description = "Add a product to the shopping cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItemToCart(@Valid @RequestBody CartItemRequest request) {
        CartResponse cart = cartService.addItemToCart(currentUser.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cart));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItemQuantity(
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        CartResponse cart = cartService.updateCartItemQuantity(currentUser.getUserId(), itemId, quantity);
        return ResponseEntity.ok(ApiResponse.success("Cart updated", cart));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItemFromCart(@PathVariable Long itemId) {
        CartResponse cart = cartService.removeItemFromCart(currentUser.getUserId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", cart));
    }
}
