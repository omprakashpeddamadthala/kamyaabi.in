package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.WishlistItemResponse;
import com.kamyaabi.dto.response.WishlistResponse;
import com.kamyaabi.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class WishlistMapperTest {

    private WishlistMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new WishlistMapper();
    }

    @Test
    void toResponse_shouldMapWishlistCorrectly() {
        Product product = Product.builder()
                .id(10L)
                .name("Cashews")
                .slug("cashews")
                .category(Category.builder().id(1L).name("Dry Fruits").slug("dry-fruits").build())
                .price(new BigDecimal("899.00"))
                .discountPrice(new BigDecimal("799.00"))
                .stock(50)
                .active(true)
                .imageUrl("cashews.jpg")
                .build();

        WishlistItem item = WishlistItem.builder()
                .id(1L)
                .product(product)
                .addedAt(LocalDateTime.now())
                .build();

        User user = User.builder().id(1L).email("test@kamyaabi.in").name("Test").role(User.Role.USER).build();
        Wishlist wishlist = Wishlist.builder().id(1L).user(user).items(List.of(item)).build();
        item.setWishlist(wishlist);

        WishlistResponse response = mapper.toResponse(wishlist);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.totalItems()).isEqualTo(1);
        assertThat(response.items()).hasSize(1);

        WishlistItemResponse itemResponse = response.items().get(0);
        assertThat(itemResponse.productId()).isEqualTo(10L);
        assertThat(itemResponse.productName()).isEqualTo("Cashews");
        assertThat(itemResponse.productSlug()).isEqualTo("cashews");
        assertThat(itemResponse.categorySlug()).isEqualTo("dry-fruits");
        assertThat(itemResponse.productImageUrl()).isEqualTo("cashews.jpg");
        assertThat(itemResponse.productPrice()).isEqualByComparingTo(new BigDecimal("899.00"));
        assertThat(itemResponse.productDiscountPrice()).isEqualByComparingTo(new BigDecimal("799.00"));
        assertThat(itemResponse.inStock()).isTrue();
    }

    @Test
    void toItemResponse_outOfStock_shouldSetInStockFalse() {
        Product product = Product.builder()
                .id(5L)
                .name("Almonds")
                .slug("almonds")
                .price(new BigDecimal("499.00"))
                .stock(0)
                .active(true)
                .imageUrl("almonds.jpg")
                .build();

        WishlistItem item = WishlistItem.builder()
                .id(2L)
                .product(product)
                .addedAt(LocalDateTime.now())
                .build();

        WishlistItemResponse response = mapper.toItemResponse(item);

        assertThat(response.productImageUrl()).isEqualTo("almonds.jpg");
        assertThat(response.inStock()).isFalse();
    }
}
