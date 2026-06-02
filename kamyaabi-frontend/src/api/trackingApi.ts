import axiosInstance from './axiosInstance';
import { ApiResponse, PublicOrderTracking } from '../types';

export const trackingApi = {
  trackByOrderId: (orderId: number) =>
    axiosInstance.get<ApiResponse<PublicOrderTracking>>(
      `/api/shipping/track/status/${orderId}`,
    ),

  trackByAwb: (awb: string) =>
    axiosInstance.get<ApiResponse<PublicOrderTracking>>(
      '/api/shipping/track/status',
      { params: { awb } },
    ),
};
