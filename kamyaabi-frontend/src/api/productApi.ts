import axiosInstance from './axiosInstance';
import { ApiResponse, PageResponse, Product } from '../types';

export const productApi = {
  getAll: (page = 0, size = 6, sortBy = 'createdAt', sortDir = 'desc') =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>('/api/products', {
      params: { page, size, sortBy, sortDir },
    }),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<Product>>(`/api/products/${id}`),

  getBySlug: (slug: string) =>
    axiosInstance.get<ApiResponse<Product>>(`/api/products/slug/${encodeURIComponent(slug)}`),

  getByCategory: (categoryId: number, page = 0, size = 6) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>(`/api/products/category/${categoryId}`, {
      params: { page, size },
    }),

  search: (keyword: string, page = 0, size = 6) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>('/api/products/search', {
      params: { keyword, page, size },
    }),

  getFeatured: () =>
    axiosInstance.get<ApiResponse<Product[]>>('/api/products/featured'),
};
