import axiosInstance from './axiosInstance';
import { ApiResponse, Order, PageResponse } from '../types';

export const orderApi = {
  create: (shippingAddressId: number) =>
    axiosInstance.post<ApiResponse<Order>>('/api/orders', { shippingAddressId }),

  getAll: (page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<Order>>>('/api/orders', {
      params: { page, size },
    }),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<Order>>(`/api/orders/${id}`),
};
