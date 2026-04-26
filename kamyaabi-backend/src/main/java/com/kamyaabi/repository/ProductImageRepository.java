package com.kamyaabi.repository;

import com.kamyaabi.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderByDisplayOrderAsc(Long productId);

    Optional<ProductImage> findByIdAndProductId(Long id, Long productId);

    long countByProductId(Long productId);

    /**
     * Clear {@code is_main = true} on every image belonging to the given product.
     * Used before promoting a new image to main so the single-main invariant holds.
     */
    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isMain = false WHERE pi.product.id = :productId")
    int clearMainFlagForProduct(@Param("productId") Long productId);
}
