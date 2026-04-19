package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.CartItemRequest;
import com.kamyaabi.dto.response.CartResponse;
import com.kamyaabi.entity.*;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.CartMapper;
import com.kamyaabi.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserRepository userRepository;
    @Mock private CartMapper cartMapper;

    @InjectMocks private CartServiceImpl cartService;

    private User user;
    private Cart cart;
    private Product product;
    private CartResponse cartResponse;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("test@kamyaabi.shop").name("Test").role(User.Role.USER).build();
        cart = Cart.builder().id(1L).user(user).items(new ArrayList<>()).build();
        product = Product.builder().id(1L).name("Cashews").price(new BigDecimal("899.00"))
                .stock(100).active(true).category(Category.builder().id(1L).name("Cashews").build()).build();
        cartResponse = CartResponse.builder().id(1L).totalAmount(BigDecimal.ZERO).totalItems(0).build();
    }

    @Test
    void getCart_existingCart_shouldReturnCart() {
        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(cart));
        when(cartMapper.toResponse(cart)).thenReturn(cartResponse);

        CartResponse result = cartService.getCart(1L);

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getCart_noCart_shouldCreateAndReturnCart() {
        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.empty());
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        when(cartMapper.toResponse(cart)).thenReturn(cartResponse);

        CartResponse result = cartService.getCart(1L);

        assertThat(result).isNotNull();
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    void getCart_noCartNoUser_shouldThrowException() {
        when(cartRepository.findByUserIdWithItems(999L)).thenReturn(Optional.empty());
        when(cartRepository.findByUserId(999L)).thenReturn(Optional.empty());
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.getCart(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void addItemToCart_newItem_shouldAddAndReturn() {
        CartItemRequest request = CartItemRequest.builder().productId(1L).quantity(2).build();
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, 1L)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(cart));
        when(cartMapper.toResponse(any(Cart.class))).thenReturn(cartResponse);

        CartResponse result = cartService.addItemToCart(1L, request);

        assertThat(result).isNotNull();
        verify(cartRepository, atLeastOnce()).save(any(Cart.class));
    }

    @Test
    void addItemToCart_existingItem_shouldUpdateQuantity() {
        CartItem existingItem = CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build();
        CartItemRequest request = CartItemRequest.builder().productId(1L).quantity(2).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, 1L)).thenReturn(Optional.of(existingItem));
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(existingItem);
        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(cart));
        when(cartMapper.toResponse(any(Cart.class))).thenReturn(cartResponse);

        CartResponse result = cartService.addItemToCart(1L, request);

        assertThat(result).isNotNull();
        assertThat(existingItem.getQuantity()).isEqualTo(3);
    }

    @Test
    void addItemToCart_inactiveProduct_shouldThrowException() {
        product.setActive(false);
        CartItemRequest request = CartItemRequest.builder().productId(1L).quantity(1).build();
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> cartService.addItemToCart(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not available");
    }

    @Test
    void addItemToCart_insufficientStock_shouldThrowException() {
        product.setStock(1);
        CartItemRequest request = CartItemRequest.builder().productId(1L).quantity(5).build();
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> cartService.addItemToCart(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void addItemToCart_existingItemInsufficientStock_shouldThrowException() {
        product.setStock(3);
        CartItem existingItem = CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build();
        CartItemRequest request = CartItemRequest.builder().productId(1L).quantity(3).build();

        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCartIdAndProductId(1L, 1L)).thenReturn(Optional.of(existingItem));

        assertThatThrownBy(() -> cartService.addItemToCart(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void addItemToCart_productNotFound_shouldThrowException() {
        CartItemRequest request = CartItemRequest.builder().productId(999L).quantity(1).build();
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.addItemToCart(1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateCartItemQuantity_shouldUpdate() {
        CartItem item = CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build();
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(item);
        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(cart));
        when(cartMapper.toResponse(cart)).thenReturn(cartResponse);

        CartResponse result = cartService.updateCartItemQuantity(1L, 1L, 3);

        assertThat(result).isNotNull();
        assertThat(item.getQuantity()).isEqualTo(3);
    }

    @Test
    void updateCartItemQuantity_zeroQuantity_shouldRemoveItem() {
        CartItem item = CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build();
        cart.getItems().add(item);
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(cart));
        when(cartMapper.toResponse(cart)).thenReturn(cartResponse);

        CartResponse result = cartService.updateCartItemQuantity(1L, 1L, 0);

        assertThat(result).isNotNull();
    }

    @Test
    void updateCartItemQuantity_insufficientStock_shouldThrowException() {
        product.setStock(2);
        CartItem item = CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build();
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> cartService.updateCartItemQuantity(1L, 1L, 5))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    void updateCartItemQuantity_wrongUser_shouldThrowException() {
        User otherUser = User.builder().id(2L).build();
        Cart otherCart = Cart.builder().id(2L).user(otherUser).build();
        CartItem item = CartItem.builder().id(1L).cart(otherCart).product(product).quantity(1).build();
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> cartService.updateCartItemQuantity(1L, 1L, 3))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not belong");
    }

    @Test
    void updateCartItemQuantity_notFound_shouldThrowException() {
        when(cartItemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.updateCartItemQuantity(1L, 999L, 3))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void removeItemFromCart_shouldRemove() {
        CartItem item = CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build();
        cart.getItems().add(item);
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);
        when(cartRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(cart));
        when(cartMapper.toResponse(cart)).thenReturn(cartResponse);

        CartResponse result = cartService.removeItemFromCart(1L, 1L);

        assertThat(result).isNotNull();
    }

    @Test
    void removeItemFromCart_wrongUser_shouldThrowException() {
        User otherUser = User.builder().id(2L).build();
        Cart otherCart = Cart.builder().id(2L).user(otherUser).build();
        CartItem item = CartItem.builder().id(1L).cart(otherCart).product(product).quantity(1).build();
        when(cartItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> cartService.removeItemFromCart(1L, 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void removeItemFromCart_notFound_shouldThrowException() {
        when(cartItemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cartService.removeItemFromCart(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void clearCart_existingCart_shouldClearItems() {
        cart.getItems().add(CartItem.builder().id(1L).cart(cart).product(product).quantity(1).build());
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        cartService.clearCart(1L);

        assertThat(cart.getItems()).isEmpty();
        verify(cartRepository).save(cart);
    }

    @Test
    void clearCart_noCart_shouldDoNothing() {
        when(cartRepository.findByUserId(1L)).thenReturn(Optional.empty());

        cartService.clearCart(1L);

        verify(cartRepository, never()).save(any(Cart.class));
    }
}
