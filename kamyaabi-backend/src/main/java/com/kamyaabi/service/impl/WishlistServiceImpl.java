package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.WishlistResponse;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.User;
import com.kamyaabi.entity.Wishlist;
import com.kamyaabi.entity.WishlistItem;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.WishlistMapper;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.repository.WishlistItemRepository;
import com.kamyaabi.repository.WishlistRepository;
import com.kamyaabi.service.WishlistService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final WishlistMapper wishlistMapper;

    public WishlistServiceImpl(WishlistRepository wishlistRepository,
                               WishlistItemRepository wishlistItemRepository,
                               ProductRepository productRepository,
                               UserRepository userRepository,
                               WishlistMapper wishlistMapper) {
        this.wishlistRepository = wishlistRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.wishlistMapper = wishlistMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public WishlistResponse getWishlist(Long userId) {
        log.debug("Fetching wishlist for user: {}", userId);
        Wishlist wishlist = wishlistRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> getOrCreateWishlist(userId));
        return wishlistMapper.toResponse(wishlist);
    }

    @Override
    public WishlistResponse addItem(Long userId, Long productId) {
        log.info("Adding product {} to wishlist for user: {}", productId, userId);
        Wishlist wishlist = getOrCreateWishlist(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Optional<WishlistItem> existing = wishlistItemRepository
                .findByWishlistIdAndProductId(wishlist.getId(), product.getId());

        if (existing.isEmpty()) {
            WishlistItem newItem = WishlistItem.builder()
                    .wishlist(wishlist)
                    .product(product)
                    .build();
            wishlist.getItems().add(newItem);
            wishlistRepository.save(wishlist);
        }

        Wishlist updated = wishlistRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));
        return wishlistMapper.toResponse(updated);
    }

    @Override
    public WishlistResponse removeItem(Long userId, Long productId) {
        log.info("Removing product {} from wishlist for user: {}", productId, userId);
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));

        wishlist.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
        wishlistRepository.save(wishlist);

        Wishlist updated = wishlistRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wishlist not found"));
        return wishlistMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isProductInWishlist(Long userId, Long productId) {
        return wishlistRepository.findByUserId(userId)
                .map(w -> wishlistItemRepository.existsByWishlistIdAndProductId(w.getId(), productId))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getWishlistProductIds(Long userId) {
        return wishlistItemRepository.findProductIdsByUserId(userId);
    }

    private Wishlist getOrCreateWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
                    Wishlist newWishlist = Wishlist.builder().user(user).build();
                    return wishlistRepository.save(newWishlist);
                });
    }
}
