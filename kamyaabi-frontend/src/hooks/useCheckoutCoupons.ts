import { useCallback, useEffect, useState } from 'react';

import { couponApi } from '../api/couponApi';
import { Coupon, CouponValidationResult } from '../types';

export function useCheckoutCoupons() {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);

  useEffect(() => {
    const loadAvailableCoupons = async () => {
      try {
        const res = await couponApi.getAvailable();
        setAvailableCoupons(res.data.data || []);
      } catch {
        // Silently fail — available coupons is not critical
      }
    };
    loadAvailableCoupons();
  }, []);

  const validateCoupon = useCallback(
    async (code?: string) => {
      const codeToValidate = code || couponCode;
      if (!codeToValidate.trim()) return;
      setCouponLoading(true);
      setCouponError(null);
      setCouponResult(null);
      try {
        const res = await couponApi.validate(codeToValidate.trim());
        const result = res.data.data;
        if (result.valid) {
          setCouponResult(result);
          setCouponCode(codeToValidate.trim().toUpperCase());
          setCouponError(null);
        } else {
          setCouponError(result.message || 'This coupon code is not valid');
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setCouponError(e.response?.data?.message || 'Failed to validate coupon. Please try again.');
      } finally {
        setCouponLoading(false);
      }
    },
    [couponCode],
  );

  const applyAvailableCoupon = useCallback(
    (code: string) => {
      setCouponCode(code);
      setCouponError(null);
      validateCoupon(code);
      setShowAvailableCoupons(false);
    },
    [validateCoupon],
  );

  const removeCoupon = useCallback(() => {
    setCouponCode('');
    setCouponResult(null);
    setCouponError(null);
  }, []);

  const discountAmount = couponResult?.discountAmount ?? 0;

  return {
    couponCode,
    setCouponCode,
    couponLoading,
    couponResult,
    couponError,
    setCouponError,
    availableCoupons,
    showAvailableCoupons,
    setShowAvailableCoupons,
    validateCoupon,
    applyAvailableCoupon,
    removeCoupon,
    discountAmount,
  };
}
