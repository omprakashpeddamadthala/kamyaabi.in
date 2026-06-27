import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types';

export interface PincodeServiceability {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
  estimatedDays?: number;
  courierName?: string;
  codAvailable?: string;
  message?: string;
}

export const shippingApi = {
  checkServiceability: (pincode: string, weight = 0.5) =>
    axiosInstance.get<ApiResponse<PincodeServiceability>>(
      '/api/shipping/serviceability',
      { params: { pincode, weight } },
    ),

  getDeliveryEstimate: (pincode: string, productId: number) =>
    axiosInstance.get<ApiResponse<PincodeServiceability>>(
      '/api/delivery/estimate',
      { params: { pincode, productId } },
    ),

  /** Reads the cached Shiprocket estimate for the logged-in user from the database. */
  getCachedEstimate: () =>
    axiosInstance.get<ApiResponse<PincodeServiceability>>('/api/delivery/cached-estimate'),
};
