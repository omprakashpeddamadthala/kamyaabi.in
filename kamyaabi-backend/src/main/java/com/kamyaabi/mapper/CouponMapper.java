package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.CouponResponse;
import com.kamyaabi.entity.Coupon;
import com.kamyaabi.repository.CouponUsageRepository;
import org.springframework.stereotype.Component;

@Component
public class CouponMapper {

    private final CouponUsageRepository couponUsageRepository;

    public CouponMapper(CouponUsageRepository couponUsageRepository) {
        this.couponUsageRepository = couponUsageRepository;
    }

    public CouponResponse toResponse(Coupon coupon) {
        long usageCount = 0;
        long uniqueMembers = 0;
        if (coupon.getId() != null) {
            usageCount = coupon.getUsages() != null ? coupon.getUsages().size() : 0;
            uniqueMembers = couponUsageRepository.countDistinctUsersByCouponId(coupon.getId());
        }
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .isActive(coupon.getIsActive())
                .expiresAt(coupon.getExpiresAt())
                .usageCount(usageCount)
                .uniqueMembers(uniqueMembers)
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }
}
