package com.kamyaabi.repository;

import com.kamyaabi.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    Optional<WishlistItem> findByWishlistIdAndProductId(Long wishlistId, Long productId);

    boolean existsByWishlistIdAndProductId(Long wishlistId, Long productId);

    @Query("SELECT wi.product.id FROM WishlistItem wi WHERE wi.wishlist.user.id = :userId")
    Set<Long> findProductIdsByUserId(@Param("userId") Long userId);
}
