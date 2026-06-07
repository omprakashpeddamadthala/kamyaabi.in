import axiosInstance from './axiosInstance';
import { ApiResponse, Wishlist } from '../types';

export const wishlistApi = {
  get: () =>
    axiosInstance.get<ApiResponse<Wishlist>>('/api/wishlist'),

  addItem: (productId: number) =>
    axiosInstance.post<ApiResponse<Wishlist>>(`/api/wishlist/items/${productId}`),

  removeItem: (productId: number) =>
    axiosInstance.delete<ApiResponse<Wishlist>>(`/api/wishlist/items/${productId}`),

  checkProduct: (productId: number) =>
    axiosInstance.get<ApiResponse<boolean>>(`/api/wishlist/check/${productId}`),

  getProductIds: () =>
    axiosInstance.get<ApiResponse<number[]>>('/api/wishlist/product-ids'),
};
