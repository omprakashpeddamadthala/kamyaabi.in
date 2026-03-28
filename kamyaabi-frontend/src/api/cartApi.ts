import axiosInstance from './axiosInstance';
import { ApiResponse, Cart } from '../types';

export const cartApi = {
  get: () =>
    axiosInstance.get<ApiResponse<Cart>>('/api/cart'),

  addItem: (productId: number, quantity: number) =>
    axiosInstance.post<ApiResponse<Cart>>('/api/cart/items', { productId, quantity }),

  updateQuantity: (itemId: number, quantity: number) =>
    axiosInstance.put<ApiResponse<Cart>>(`/api/cart/items/${itemId}`, null, {
      params: { quantity },
    }),

  removeItem: (itemId: number) =>
    axiosInstance.delete<ApiResponse<Cart>>(`/api/cart/items/${itemId}`),
};
