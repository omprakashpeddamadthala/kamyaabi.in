import axiosInstance from './axiosInstance';
import { ApiResponse, Coupon, CouponValidationResult } from '../types';

export const couponApi = {
  validate: (code: string) =>
    axiosInstance.post<ApiResponse<CouponValidationResult>>('/api/coupons/validate', { code }),

  apply: (code: string) =>
    axiosInstance.post<ApiResponse<CouponValidationResult>>('/api/coupons/apply', { code }),

  getAvailable: () =>
    axiosInstance.get<ApiResponse<Coupon[]>>('/api/coupons/available'),
};
