package com.kamyaabi.repository;

import com.kamyaabi.entity.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    long countByCouponIdAndUserId(Long couponId, Long userId);

    @Query("SELECT COUNT(DISTINCT cu.user.id) FROM CouponUsage cu WHERE cu.coupon.id = :couponId")
    long countDistinctUsersByCouponId(@Param("couponId") Long couponId);

    @Query("SELECT COUNT(cu) FROM CouponUsage cu "
            + "WHERE cu.coupon.id = :couponId AND cu.user.id = :userId "
            + "AND cu.usedAt >= :startOfDay")
    long countByCouponIdAndUserIdAndUsedAtAfter(
            @Param("couponId") Long couponId,
            @Param("userId") Long userId,
            @Param("startOfDay") LocalDateTime startOfDay);
}
