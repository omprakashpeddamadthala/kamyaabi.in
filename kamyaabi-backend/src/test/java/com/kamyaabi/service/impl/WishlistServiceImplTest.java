package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.WishlistResponse;
import com.kamyaabi.entity.*;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.WishlistMapper;
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
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceImplTest {

    @Mock private WishlistRepository wishlistRepository;
    @Mock private WishlistItemRepository wishlistItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserRepository userRepository;
    @Mock private WishlistMapper wishlistMapper;

    @InjectMocks private WishlistServiceImpl wishlistService;

    private User user;
    private Wishlist wishlist;
    private Product product;
    private WishlistResponse wishlistResponse;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("test@kamyaabi.in").name("Test").role(User.Role.USER).build();
        wishlist = Wishlist.builder().id(1L).user(user).items(new ArrayList<>()).build();
        product = Product.builder().id(10L).name("Cashews").price(new BigDecimal("899.00"))
                .stock(100).active(true).category(Category.builder().id(1L).name("Nuts").build()).build();
        wishlistResponse = WishlistResponse.builder().id(1L).items(new ArrayList<>()).totalItems(0).build();
    }

    @Test
    void getWishlist_existingWishlist_shouldReturnWishlist() {
        when(wishlistRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(wishlist));
        when(wishlistMapper.toResponse(wishlist)).thenReturn(wishlistResponse);

        WishlistResponse result = wishlistService.getWishlist(1L);

        assertThat(result.id()).isEqualTo(1L);
        verify(wishlistRepository).findByUserIdWithItems(1L);
    }

    @Test
    void getWishlist_noExistingWishlist_shouldCreateNew() {
        when(wishlistRepository.findByUserIdWithItems(1L)).thenReturn(Optional.empty());
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(wishlistRepository.save(any(Wishlist.class))).thenReturn(wishlist);
        when(wishlistMapper.toResponse(any(Wishlist.class))).thenReturn(wishlistResponse);

        WishlistResponse result = wishlistService.getWishlist(1L);

        assertThat(result).isNotNull();
        verify(wishlistRepository).save(any(Wishlist.class));
    }

    @Test
    void addItem_newProduct_shouldAddToWishlist() {
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.of(wishlist));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(wishlistItemRepository.findByWishlistIdAndProductId(1L, 10L)).thenReturn(Optional.empty());
        when(wishlistRepository.save(wishlist)).thenReturn(wishlist);
        when(wishlistRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(wishlist));
        when(wishlistMapper.toResponse(wishlist)).thenReturn(wishlistResponse);

        WishlistResponse result = wishlistService.addItem(1L, 10L);

        assertThat(result).isNotNull();
        verify(wishlistRepository).save(wishlist);
    }

    @Test
    void addItem_duplicateProduct_shouldNotAddAgain() {
        WishlistItem existing = WishlistItem.builder().id(1L).wishlist(wishlist).product(product).build();
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.of(wishlist));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(wishlistItemRepository.findByWishlistIdAndProductId(1L, 10L)).thenReturn(Optional.of(existing));
        when(wishlistRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(wishlist));
        when(wishlistMapper.toResponse(wishlist)).thenReturn(wishlistResponse);

        WishlistResponse result = wishlistService.addItem(1L, 10L);

        assertThat(result).isNotNull();
        verify(wishlistRepository, never()).save(any());
    }

    @Test
    void addItem_productNotFound_shouldThrow() {
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.of(wishlist));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.addItem(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void removeItem_existingItem_shouldRemove() {
        WishlistItem item = WishlistItem.builder().id(1L).wishlist(wishlist).product(product).build();
        wishlist.getItems().add(item);
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.of(wishlist));
        when(wishlistRepository.save(wishlist)).thenReturn(wishlist);
        when(wishlistRepository.findByUserIdWithItems(1L)).thenReturn(Optional.of(wishlist));
        when(wishlistMapper.toResponse(wishlist)).thenReturn(wishlistResponse);

        WishlistResponse result = wishlistService.removeItem(1L, 10L);

        assertThat(result).isNotNull();
        verify(wishlistRepository).save(wishlist);
    }

    @Test
    void removeItem_noWishlist_shouldThrow() {
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.removeItem(1L, 10L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void isProductInWishlist_exists_shouldReturnTrue() {
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.of(wishlist));
        when(wishlistItemRepository.existsByWishlistIdAndProductId(1L, 10L)).thenReturn(true);

        boolean result = wishlistService.isProductInWishlist(1L, 10L);

        assertThat(result).isTrue();
    }

    @Test
    void isProductInWishlist_noWishlist_shouldReturnFalse() {
        when(wishlistRepository.findByUserId(1L)).thenReturn(Optional.empty());

        boolean result = wishlistService.isProductInWishlist(1L, 10L);

        assertThat(result).isFalse();
    }

    @Test
    void getWishlistProductIds_shouldReturnIds() {
        when(wishlistItemRepository.findProductIdsByUserId(1L)).thenReturn(Set.of(10L, 20L));

        Set<Long> result = wishlistService.getWishlistProductIds(1L);

        assertThat(result).containsExactlyInAnyOrder(10L, 20L);
    }
}
