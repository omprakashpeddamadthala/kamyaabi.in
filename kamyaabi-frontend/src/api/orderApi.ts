import axiosInstance from './axiosInstance';
import { ApiResponse, Order, PageResponse, PaymentMethod, TrackingInfo } from '../types';

export const orderApi = {
  create: (shippingAddressId: number, couponCode?: string, paymentMethod?: PaymentMethod) =>
    axiosInstance.post<ApiResponse<Order>>('/api/orders', {
      shippingAddressId,
      ...(couponCode ? { couponCode } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    }),

  getAll: (page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<Order>>>('/api/orders', {
      params: { page, size },
    }),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<Order>>(`/api/orders/${id}`),

  getInvoiceUrl: (id: number) =>
    axiosInstance.get<ApiResponse<{ invoiceUrl: string }>>(`/api/orders/${id}/invoice`, {
      params: { format: 'url' },
    }),

  downloadInvoice: (id: number) =>
    axiosInstance.get<Blob>(`/api/orders/${id}/invoice`, { responseType: 'blob' }),

  trackShipment: (orderId: number) =>
    axiosInstance.get<ApiResponse<TrackingInfo>>(`/api/shipping/track/${orderId}`),
};
