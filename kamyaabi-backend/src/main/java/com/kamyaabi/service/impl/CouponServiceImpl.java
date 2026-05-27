package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.CouponRequest;
import com.kamyaabi.dto.response.CouponResponse;
import com.kamyaabi.dto.response.CouponValidationResponse;
import com.kamyaabi.entity.Coupon;
import com.kamyaabi.entity.CouponUsage;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.CouponMapper;
import com.kamyaabi.repository.CouponRepository;
import com.kamyaabi.repository.CouponUsageRepository;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.CouponService;
import com.kamyaabi.service.SettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@Transactional
public class CouponServiceImpl implements CouponService {

    static final String COUPON_ENABLED = "coupon_enabled";
    static final String COUPON_MAX_USES_PER_USER = "coupon_max_uses_per_user";
    static final String COUPON_MAX_USES_PER_USER_PER_DAY = "coupon_max_uses_per_user_per_day";
    static final String COUPON_MAX_TOTAL_MEMBERS = "coupon_max_total_members";

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CouponMapper couponMapper;
    private final SettingsService settingsService;

    public CouponServiceImpl(CouponRepository couponRepository,
                             CouponUsageRepository couponUsageRepository,
                             UserRepository userRepository,
                             OrderRepository orderRepository,
                             CouponMapper couponMapper,
                             SettingsService settingsService) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.couponMapper = couponMapper;
        this.settingsService = settingsService;
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(String code, Long userId, BigDecimal orderTotal) {
        if (!settingsService.getBoolean(COUPON_ENABLED, true)) {
            return invalid(code, "Coupon system is currently disabled");
        }
        return doValidate(code, userId, orderTotal);
    }

    @Override
    public CouponValidationResponse applyCoupon(String code, Long userId, Long orderId, BigDecimal orderTotal) {
        if (!settingsService.getBoolean(COUPON_ENABLED, true)) {
            return invalid(code, "Coupon system is currently disabled");
        }

        CouponValidationResponse validation = doValidate(code, userId, orderTotal);
        if (!validation.valid()) {
            return validation;
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "code", code));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Order order = null;
        if (orderId != null) {
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        }

        // Atomic redemption — record usage within the same transaction
        CouponUsage usage = CouponUsage.builder()
                .coupon(coupon)
                .user(user)
                .order(order)
                .usedAt(LocalDateTime.now())
                .build();
        couponUsageRepository.save(usage);

        log.info("Coupon {} applied by user {} for order {}", code, userId, orderId);
        return validation;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> listCoupons(String q, Boolean active, Pageable pageable) {
        return couponRepository.searchCoupons(q, active, pageable)
                .map(couponMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", id));
        return couponMapper.toResponse(coupon);
    }

    @Override
    public CouponResponse createCoupon(CouponRequest request) {
        String normalizedCode = request.code().trim().toUpperCase();
        if (couponRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new DuplicateResourceException("Coupon with code '" + normalizedCode + "' already exists");
        }

        Coupon.DiscountType discountType;
        try {
            discountType = Coupon.DiscountType.valueOf(request.discountType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid discount type. Must be PERCENTAGE or FLAT");
        }

        if (discountType == Coupon.DiscountType.PERCENTAGE
                && request.discountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Percentage discount cannot exceed 100%");
        }

        LocalDateTime expiresAt = request.expiresAt();
        if (expiresAt == null) {
            int defaultDays = settingsService.getInt("coupon_default_expiry_days", 30);
            expiresAt = LocalDateTime.now().plusDays(defaultDays);
        }

        Coupon coupon = Coupon.builder()
                .code(normalizedCode)
                .discountType(discountType)
                .discountValue(request.discountValue())
                .isActive(request.isActive() != null ? request.isActive() : true)
                .expiresAt(expiresAt)
                .build();

        coupon = couponRepository.save(coupon);
        log.info("Coupon created: {} (id={})", coupon.getCode(), coupon.getId());
        return couponMapper.toResponse(coupon);
    }

    @Override
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", id));

        String normalizedCode = request.code().trim().toUpperCase();
        if (!coupon.getCode().equalsIgnoreCase(normalizedCode)
                && couponRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new DuplicateResourceException("Coupon with code '" + normalizedCode + "' already exists");
        }

        Coupon.DiscountType discountType;
        try {
            discountType = Coupon.DiscountType.valueOf(request.discountType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid discount type. Must be PERCENTAGE or FLAT");
        }

        if (discountType == Coupon.DiscountType.PERCENTAGE
                && request.discountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Percentage discount cannot exceed 100%");
        }

        coupon.setCode(normalizedCode);
        coupon.setDiscountType(discountType);
        coupon.setDiscountValue(request.discountValue());
        if (request.isActive() != null) {
            coupon.setIsActive(request.isActive());
        }
        if (request.expiresAt() != null) {
            coupon.setExpiresAt(request.expiresAt());
        }

        coupon = couponRepository.save(coupon);
        log.info("Coupon updated: {} (id={})", coupon.getCode(), coupon.getId());
        return couponMapper.toResponse(coupon);
    }

    @Override
    public void deactivateCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", id));
        coupon.setIsActive(false);
        couponRepository.save(coupon);
        log.info("Coupon deactivated: {} (id={})", coupon.getCode(), coupon.getId());
    }

    /**
     * Core validation logic — fail-fast ordered checks reading dynamic config
     * from the settings service on every call.
     */
    private CouponValidationResponse doValidate(String code, Long userId, BigDecimal orderTotal) {
        if (code == null || code.isBlank()) {
            return invalid(code, "Coupon code is required");
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim()).orElse(null);

        // 1. Does coupon exist and is it active?
        if (coupon == null || !coupon.getIsActive()) {
            return invalid(code, "Invalid or inactive coupon code");
        }

        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            return invalid(code, "This coupon has expired");
        }

        // 2. Has the coupon hit its global member cap?
        int maxTotalMembers = settingsService.getInt(COUPON_MAX_TOTAL_MEMBERS, 20);
        long uniqueMembers = couponUsageRepository.countDistinctUsersByCouponId(coupon.getId());
        // Only count toward the cap if this user hasn't used it before
        boolean userHasUsedBefore = couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), userId) > 0;
        if (!userHasUsedBefore && uniqueMembers >= maxTotalMembers) {
            return invalid(code, "This coupon has reached its maximum redemption limit");
        }

        // 3. Has this user exceeded max all-time uses?
        int maxUsesPerUser = settingsService.getInt(COUPON_MAX_USES_PER_USER, 1);
        long userUsageCount = couponUsageRepository.countByCouponIdAndUserId(coupon.getId(), userId);
        if (userUsageCount >= maxUsesPerUser) {
            return invalid(code, "You have already used this coupon the maximum number of times");
        }

        // 4. Has this user exceeded max daily uses?
        int maxUsesPerUserPerDay = settingsService.getInt(COUPON_MAX_USES_PER_USER_PER_DAY, 1);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long todayCount = couponUsageRepository.countByCouponIdAndUserIdAndUsedAtAfter(
                coupon.getId(), userId, startOfDay);
        if (todayCount >= maxUsesPerUserPerDay) {
            return invalid(code, "You have reached the daily usage limit for this coupon");
        }

        // 5. Calculate discount
        BigDecimal discountAmount = calculateDiscount(coupon, orderTotal);

        return CouponValidationResponse.builder()
                .valid(true)
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType().name())
                .discountValue(coupon.getDiscountValue())
                .discountAmount(discountAmount)
                .message("Coupon applied successfully! You save ₹" + discountAmount)
                .build();
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal orderTotal) {
        if (orderTotal == null || orderTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
            discount = orderTotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discount = coupon.getDiscountValue();
        }

        // Discount cannot exceed order total
        if (discount.compareTo(orderTotal) > 0) {
            discount = orderTotal;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    private CouponValidationResponse invalid(String code, String message) {
        return CouponValidationResponse.builder()
                .valid(false)
                .code(code)
                .message(message)
                .build();
    }
}
