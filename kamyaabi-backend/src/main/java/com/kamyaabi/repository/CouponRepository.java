package com.kamyaabi.repository;

import com.kamyaabi.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query("SELECT c FROM Coupon c WHERE "
            + "(:q IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', :q, '%'))) "
            + "AND (:active IS NULL OR c.isActive = :active)")
    Page<Coupon> searchCoupons(@Param("q") String q,
                               @Param("active") Boolean active,
                               Pageable pageable);
}
