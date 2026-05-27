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

    @Query(value = "SELECT * FROM coupons c WHERE "
            + "(CAST(:q AS TEXT) IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', CAST(:q AS TEXT), '%'))) "
            + "AND (CAST(:active AS BOOLEAN) IS NULL OR c.is_active = CAST(:active AS BOOLEAN))",
            countQuery = "SELECT COUNT(*) FROM coupons c WHERE "
                    + "(CAST(:q AS TEXT) IS NULL OR LOWER(c.code) LIKE LOWER(CONCAT('%', CAST(:q AS TEXT), '%'))) "
                    + "AND (CAST(:active AS BOOLEAN) IS NULL OR c.is_active = CAST(:active AS BOOLEAN))",
            nativeQuery = true)
    Page<Coupon> searchCoupons(@Param("q") String q,
                               @Param("active") Boolean active,
                               Pageable pageable);
}
