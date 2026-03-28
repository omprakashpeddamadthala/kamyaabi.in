import axiosInstance from './axiosInstance';
import { ApiResponse, PageResponse, Product } from '../types';

export const productApi = {
  getAll: (page = 0, size = 12, sortBy = 'createdAt', sortDir = 'desc') =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>('/api/products', {
      params: { page, size, sortBy, sortDir },
    }),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<Product>>(`/api/products/${id}`),

  getByCategory: (categoryId: number, page = 0, size = 12) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>(`/api/products/category/${categoryId}`, {
      params: { page, size },
    }),

  search: (keyword: string, page = 0, size = 12) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>('/api/products/search', {
      params: { keyword, page, size },
    }),

  getFeatured: () =>
    axiosInstance.get<ApiResponse<Product[]>>('/api/products/featured'),
};
