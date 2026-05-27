package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.CouponRequest;
import com.kamyaabi.dto.response.CouponResponse;
import com.kamyaabi.dto.response.CouponValidationResponse;
import com.kamyaabi.entity.Coupon;
import com.kamyaabi.entity.CouponUsage;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.CouponMapper;
import com.kamyaabi.repository.CouponRepository;
import com.kamyaabi.repository.CouponUsageRepository;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.SettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceImplTest {

    @Mock private CouponRepository couponRepository;
    @Mock private CouponUsageRepository couponUsageRepository;
    @Mock private UserRepository userRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private CouponMapper couponMapper;
    @Mock private SettingsService settingsService;

    @InjectMocks private CouponServiceImpl couponService;

    // ── Validation Tests ────────────────────────────────────

    @Test
    void validateCoupon_returnsInvalid_whenSystemDisabled() {
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(false);
        CouponValidationResponse res = couponService.validateCoupon("CODE", 1L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("disabled");
    }

    @Test
    void validateCoupon_returnsInvalid_whenCodeNotFound() {
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("BAD")).thenReturn(Optional.empty());
        CouponValidationResponse res = couponService.validateCoupon("BAD", 1L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("Invalid or inactive");
    }

    @Test
    void validateCoupon_returnsInvalid_whenCouponInactive() {
        Coupon coupon = buildCoupon(false, null);
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        CouponValidationResponse res = couponService.validateCoupon("SAVE10", 1L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("Invalid or inactive");
    }

    @Test
    void validateCoupon_returnsInvalid_whenExpired() {
        Coupon coupon = buildCoupon(true, LocalDateTime.now().minusDays(1));
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        CouponValidationResponse res = couponService.validateCoupon("SAVE10", 1L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("expired");
    }

    @Test
    void validateCoupon_returnsInvalid_whenGlobalMemberCapReached() {
        Coupon coupon = buildCoupon(true, LocalDateTime.now().plusDays(30));
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_TOTAL_MEMBERS, 20)).thenReturn(5);
        when(couponUsageRepository.countDistinctUsersByCouponId(1L)).thenReturn(5L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 99L)).thenReturn(0L);

        CouponValidationResponse res = couponService.validateCoupon("SAVE10", 99L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("maximum redemption limit");
    }

    @Test
    void validateCoupon_returnsInvalid_whenUserExceededAllTimeUses() {
        Coupon coupon = buildCoupon(true, LocalDateTime.now().plusDays(30));
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_TOTAL_MEMBERS, 20)).thenReturn(100);
        when(couponUsageRepository.countDistinctUsersByCouponId(1L)).thenReturn(5L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 1L)).thenReturn(1L);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER, 1)).thenReturn(1);

        CouponValidationResponse res = couponService.validateCoupon("SAVE10", 1L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("maximum number of times");
    }

    @Test
    void validateCoupon_returnsInvalid_whenDailyLimitReached() {
        Coupon coupon = buildCoupon(true, LocalDateTime.now().plusDays(30));
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_TOTAL_MEMBERS, 20)).thenReturn(100);
        when(couponUsageRepository.countDistinctUsersByCouponId(1L)).thenReturn(5L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 1L)).thenReturn(0L);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER, 1)).thenReturn(5);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER_PER_DAY, 1)).thenReturn(1);
        when(couponUsageRepository.countByCouponIdAndUserIdAndUsedAtAfter(eq(1L), eq(1L), any()))
                .thenReturn(1L);

        CouponValidationResponse res = couponService.validateCoupon("SAVE10", 1L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("daily usage limit");
    }

    @Test
    void validateCoupon_returnsValid_withPercentageDiscount() {
        Coupon coupon = buildCoupon(true, LocalDateTime.now().plusDays(30));
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_TOTAL_MEMBERS, 20)).thenReturn(100);
        when(couponUsageRepository.countDistinctUsersByCouponId(1L)).thenReturn(2L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 1L)).thenReturn(0L);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER, 1)).thenReturn(5);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER_PER_DAY, 1)).thenReturn(5);
        when(couponUsageRepository.countByCouponIdAndUserIdAndUsedAtAfter(eq(1L), eq(1L), any()))
                .thenReturn(0L);

        CouponValidationResponse res = couponService.validateCoupon("SAVE10", 1L, new BigDecimal("200.00"));
        assertThat(res.valid()).isTrue();
        assertThat(res.discountAmount()).isEqualByComparingTo(new BigDecimal("20.00"));
    }

    @Test
    void validateCoupon_returnsInvalid_whenCodeBlank() {
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        CouponValidationResponse res = couponService.validateCoupon("  ", 1L, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        assertThat(res.message()).contains("required");
    }

    // ── Apply Tests ──────────────────────────────────────────

    @Test
    void applyCoupon_recordsUsage_whenValid() {
        Coupon coupon = buildCoupon(true, LocalDateTime.now().plusDays(30));
        User user = User.builder().id(1L).build();

        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_TOTAL_MEMBERS, 20)).thenReturn(100);
        when(couponUsageRepository.countDistinctUsersByCouponId(1L)).thenReturn(2L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 1L)).thenReturn(0L);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER, 1)).thenReturn(5);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER_PER_DAY, 1)).thenReturn(5);
        when(couponUsageRepository.countByCouponIdAndUserIdAndUsedAtAfter(eq(1L), eq(1L), any()))
                .thenReturn(0L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        CouponValidationResponse res = couponService.applyCoupon("SAVE10", 1L, null, new BigDecimal("200.00"));
        assertThat(res.valid()).isTrue();
        verify(couponUsageRepository).save(any(CouponUsage.class));
    }

    @Test
    void applyCoupon_doesNotRecordUsage_whenInvalid() {
        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("BAD")).thenReturn(Optional.empty());
        CouponValidationResponse res = couponService.applyCoupon("BAD", 1L, null, BigDecimal.TEN);
        assertThat(res.valid()).isFalse();
        verify(couponUsageRepository, never()).save(any());
    }

    // ── CRUD Tests ──────────────────────────────────────────

    @Test
    void createCoupon_saves_withUpperCaseCode() {
        CouponRequest request = CouponRequest.builder()
                .code("test50")
                .discountType("PERCENTAGE")
                .discountValue(BigDecimal.TEN)
                .build();

        when(couponRepository.existsByCodeIgnoreCase("TEST50")).thenReturn(false);
        when(settingsService.getInt("coupon_default_expiry_days", 30)).thenReturn(30);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(inv -> {
            Coupon c = inv.getArgument(0);
            c.setId(1L);
            return c;
        });
        when(couponMapper.toResponse(any())).thenReturn(CouponResponse.builder()
                .id(1L).code("TEST50").discountType("PERCENTAGE")
                .discountValue(BigDecimal.TEN).isActive(true).usageCount(0).uniqueMembers(0).build());

        CouponResponse res = couponService.createCoupon(request);
        assertThat(res.code()).isEqualTo("TEST50");
        verify(couponRepository).save(any(Coupon.class));
    }

    @Test
    void createCoupon_throwsDuplicate_whenCodeExists() {
        CouponRequest request = CouponRequest.builder()
                .code("dup")
                .discountType("FLAT")
                .discountValue(BigDecimal.TEN)
                .build();

        when(couponRepository.existsByCodeIgnoreCase("DUP")).thenReturn(true);

        assertThatThrownBy(() -> couponService.createCoupon(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createCoupon_throwsBadRequest_whenPercentageExceeds100() {
        CouponRequest request = CouponRequest.builder()
                .code("big")
                .discountType("PERCENTAGE")
                .discountValue(new BigDecimal("150"))
                .build();

        when(couponRepository.existsByCodeIgnoreCase("BIG")).thenReturn(false);

        assertThatThrownBy(() -> couponService.createCoupon(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("100%");
    }

    @Test
    void createCoupon_throwsBadRequest_whenInvalidDiscountType() {
        CouponRequest request = CouponRequest.builder()
                .code("invalid")
                .discountType("BOGUS")
                .discountValue(BigDecimal.TEN)
                .build();

        when(couponRepository.existsByCodeIgnoreCase("INVALID")).thenReturn(false);

        assertThatThrownBy(() -> couponService.createCoupon(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("PERCENTAGE or FLAT");
    }

    @Test
    void deactivateCoupon_setsInactive() {
        Coupon coupon = buildCoupon(true, null);
        when(couponRepository.findById(1L)).thenReturn(Optional.of(coupon));
        when(couponRepository.save(any())).thenReturn(coupon);

        couponService.deactivateCoupon(1L);

        assertThat(coupon.getIsActive()).isFalse();
        verify(couponRepository).save(coupon);
    }

    @Test
    void deactivateCoupon_throwsNotFound_whenMissing() {
        when(couponRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> couponService.deactivateCoupon(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void validateCoupon_flatDiscount_cappedToOrderTotal() {
        Coupon coupon = Coupon.builder()
                .id(1L)
                .code("FLAT500")
                .discountType(Coupon.DiscountType.FLAT)
                .discountValue(new BigDecimal("500.00"))
                .isActive(true)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .usages(new ArrayList<>())
                .build();

        when(settingsService.getBoolean(CouponServiceImpl.COUPON_ENABLED, true)).thenReturn(true);
        when(couponRepository.findByCodeIgnoreCase("FLAT500")).thenReturn(Optional.of(coupon));
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_TOTAL_MEMBERS, 20)).thenReturn(100);
        when(couponUsageRepository.countDistinctUsersByCouponId(1L)).thenReturn(0L);
        when(couponUsageRepository.countByCouponIdAndUserId(1L, 1L)).thenReturn(0L);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER, 1)).thenReturn(5);
        when(settingsService.getInt(CouponServiceImpl.COUPON_MAX_USES_PER_USER_PER_DAY, 1)).thenReturn(5);
        when(couponUsageRepository.countByCouponIdAndUserIdAndUsedAtAfter(eq(1L), eq(1L), any()))
                .thenReturn(0L);

        CouponValidationResponse res = couponService.validateCoupon("FLAT500", 1L, new BigDecimal("100.00"));
        assertThat(res.valid()).isTrue();
        assertThat(res.discountAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    // ── Helpers ──────────────────────────────────────────────

    private Coupon buildCoupon(boolean active, LocalDateTime expiresAt) {
        return Coupon.builder()
                .id(1L)
                .code("SAVE10")
                .discountType(Coupon.DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.TEN)
                .isActive(active)
                .expiresAt(expiresAt)
                .usages(new ArrayList<>())
                .build();
    }
}
