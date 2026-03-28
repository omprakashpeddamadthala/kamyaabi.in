package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.CartItemResponse;
import com.kamyaabi.dto.response.CartResponse;
import com.kamyaabi.entity.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CartMapperTest {

    private final CartMapper cartMapper = new CartMapper();

    @Test
    void toResponse_emptyCart_shouldReturnZeroTotals() {
        User user = User.builder().id(1L).build();
        Cart cart = Cart.builder().id(1L).user(user).items(new ArrayList<>()).build();

        CartResponse response = cartMapper.toResponse(cart);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getItems()).isEmpty();
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.getTotalItems()).isEqualTo(0);
    }

    @Test
    void toResponse_withItems_shouldCalculateTotals() {
        Product product1 = Product.builder().id(1L).name("Cashews")
                .price(new BigDecimal("899.00")).discountPrice(new BigDecimal("749.00"))
                .imageUrl("http://img1.url").build();
        Product product2 = Product.builder().id(2L).name("Almonds")
                .price(new BigDecimal("999.00")).discountPrice(null)
                .imageUrl("http://img2.url").build();

        Cart cart = Cart.builder().id(1L).items(new ArrayList<>()).build();
        CartItem item1 = CartItem.builder().id(1L).cart(cart).product(product1).quantity(2).build();
        CartItem item2 = CartItem.builder().id(2L).cart(cart).product(product2).quantity(1).build();
        cart.setItems(List.of(item1, item2));

        CartResponse response = cartMapper.toResponse(cart);

        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getTotalItems()).isEqualTo(3);
        // 749*2 + 999*1 = 2497
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("2497.00"));
    }

    @Test
    void toItemResponse_withDiscountPrice_shouldUseDiscountPrice() {
        Product product = Product.builder().id(1L).name("Cashews")
                .price(new BigDecimal("899.00")).discountPrice(new BigDecimal("749.00"))
                .imageUrl("http://img.url").build();
        CartItem item = CartItem.builder().id(1L).product(product).quantity(3).build();

        CartItemResponse response = cartMapper.toItemResponse(item);

        assertThat(response.getProductId()).isEqualTo(1L);
        assertThat(response.getProductName()).isEqualTo("Cashews");
        assertThat(response.getQuantity()).isEqualTo(3);
        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("2247.00"));
    }

    @Test
    void toItemResponse_withoutDiscountPrice_shouldUseRegularPrice() {
        Product product = Product.builder().id(1L).name("Almonds")
                .price(new BigDecimal("999.00")).discountPrice(null)
                .imageUrl("http://img.url").build();
        CartItem item = CartItem.builder().id(1L).product(product).quantity(2).build();

        CartItemResponse response = cartMapper.toItemResponse(item);

        assertThat(response.getSubtotal()).isEqualByComparingTo(new BigDecimal("1998.00"));
    }
}
