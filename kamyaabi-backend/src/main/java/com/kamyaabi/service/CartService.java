package com.kamyaabi.service;

import com.kamyaabi.dto.request.CartItemRequest;
import com.kamyaabi.dto.response.CartResponse;

public interface CartService {
    CartResponse getCart(Long userId);
    CartResponse addItemToCart(Long userId, CartItemRequest request);
    CartResponse updateCartItemQuantity(Long userId, Long itemId, Integer quantity);
    CartResponse removeItemFromCart(Long userId, Long itemId);
    void clearCart(Long userId);
}
