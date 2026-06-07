package com.kamyaabi.service;

import com.kamyaabi.dto.response.WishlistResponse;

import java.util.Set;

public interface WishlistService {

    WishlistResponse getWishlist(Long userId);

    WishlistResponse addItem(Long userId, Long productId);

    WishlistResponse removeItem(Long userId, Long productId);

    boolean isProductInWishlist(Long userId, Long productId);

    Set<Long> getWishlistProductIds(Long userId);
}
