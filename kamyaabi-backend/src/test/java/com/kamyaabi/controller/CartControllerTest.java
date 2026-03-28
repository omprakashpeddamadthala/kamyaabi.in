package com.kamyaabi.controller;

import com.kamyaabi.dto.request.CartItemRequest;
import com.kamyaabi.dto.response.CartResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.CartService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartControllerTest {

    @Mock private CartService cartService;
    @Mock private CurrentUser currentUser;

    @InjectMocks private CartController cartController;

    private final CartResponse cartResponse = CartResponse.builder()
            .id(1L).totalAmount(BigDecimal.ZERO).totalItems(0).build();

    @Test
    void getCart_shouldReturnCart() {
        when(currentUser.getUserId()).thenReturn(1L);
        when(cartService.getCart(1L)).thenReturn(cartResponse);

        ResponseEntity<?> response = cartController.getCart();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void addItemToCart_shouldReturnUpdatedCart() {
        CartItemRequest request = CartItemRequest.builder().productId(1L).quantity(2).build();
        when(currentUser.getUserId()).thenReturn(1L);
        when(cartService.addItemToCart(1L, request)).thenReturn(cartResponse);

        ResponseEntity<?> response = cartController.addItemToCart(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void updateCartItemQuantity_shouldReturnUpdatedCart() {
        when(currentUser.getUserId()).thenReturn(1L);
        when(cartService.updateCartItemQuantity(1L, 1L, 3)).thenReturn(cartResponse);

        ResponseEntity<?> response = cartController.updateCartItemQuantity(1L, 3);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void removeItemFromCart_shouldReturnUpdatedCart() {
        when(currentUser.getUserId()).thenReturn(1L);
        when(cartService.removeItemFromCart(1L, 1L)).thenReturn(cartResponse);

        ResponseEntity<?> response = cartController.removeItemFromCart(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
