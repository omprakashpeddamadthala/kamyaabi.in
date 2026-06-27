package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.WishlistItemResponse;
import com.kamyaabi.dto.response.WishlistResponse;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.Wishlist;
import com.kamyaabi.entity.WishlistItem;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WishlistMapper {

    public WishlistResponse toResponse(Wishlist wishlist) {
        List<WishlistItemResponse> itemResponses = wishlist.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        return WishlistResponse.builder()
                .id(wishlist.getId())
                .items(itemResponses)
                .totalItems(itemResponses.size())
                .build();
    }

    public WishlistItemResponse toItemResponse(WishlistItem item) {
        Product product = item.getProduct();

        return WishlistItemResponse.builder()
                .id(item.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .categorySlug(product.getCategory() != null ? product.getCategory().getSlug() : null)
                .productImageUrl(product.getMainImageUrl())
                .productPrice(product.getPrice())
                .productDiscountPrice(product.getDiscountPrice())
                .inStock(product.getActive() && product.getStock() > 0)
                .addedAt(item.getAddedAt())
                .build();
    }
}
