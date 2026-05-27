package com.kamyaabi.service;

import com.kamyaabi.dto.request.CouponRequest;
import com.kamyaabi.dto.response.CouponResponse;
import com.kamyaabi.dto.response.CouponValidationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface CouponService {

    CouponValidationResponse validateCoupon(String code, Long userId, BigDecimal orderTotal);

    CouponValidationResponse applyCoupon(String code, Long userId, Long orderId, BigDecimal orderTotal);

    Page<CouponResponse> listCoupons(String q, Boolean active, Pageable pageable);

    CouponResponse getCoupon(Long id);

    CouponResponse createCoupon(CouponRequest request);

    CouponResponse updateCoupon(Long id, CouponRequest request);

    void deactivateCoupon(Long id);
}
