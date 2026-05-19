package com.kamyaabi.repository;

import com.kamyaabi.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    long countByProductId(Long productId);

    long countByProductIdAndIsApprovedTrue(Long productId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    Double averageRatingByProductId(@Param("productId") Long productId);

    @Modifying
    @Query("DELETE FROM Review r WHERE r.product.id = :productId")
    int deleteAllByProductId(@Param("productId") Long productId);

    Optional<Review> findByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
