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
};
