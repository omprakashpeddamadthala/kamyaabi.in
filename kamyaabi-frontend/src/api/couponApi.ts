import axiosInstance from './axiosInstance';
import { ApiResponse, CouponValidationResult } from '../types';

export const couponApi = {
  validate: (code: string) =>
    axiosInstance.post<ApiResponse<CouponValidationResult>>('/api/coupons/validate', { code }),

  apply: (code: string) =>
    axiosInstance.post<ApiResponse<CouponValidationResult>>('/api/coupons/apply', { code }),
};
