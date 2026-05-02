import axiosInstance from './axiosInstance';
import { ApiResponse, PageResponse, Product } from '../types';

export type ProductSort =
  | 'price_asc'
  | 'price_desc'
  | 'name_asc'
  | 'name_desc'
  | 'newest'
  | 'oldest';

interface ListParams {
  page?: number;
  size?: number;
  sort?: ProductSort;
}

export const productApi = {
  getAll: ({ page, size, sort }: ListParams = {}) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>('/api/products', {
      params: {
        page: page ?? 0,
        ...(size != null ? { size } : {}),
        ...(sort ? { sort } : {}),
      },
    }),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<Product>>(`/api/products/${id}`),

  getBySlug: (slug: string) =>
    axiosInstance.get<ApiResponse<Product>>(`/api/products/slug/${encodeURIComponent(slug)}`),

  getByCategory: (categoryId: number, { page, size, sort }: ListParams = {}) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>(
      `/api/products/category/${categoryId}`,
      {
        params: {
          page: page ?? 0,
          ...(size != null ? { size } : {}),
          ...(sort ? { sort } : {}),
        },
      },
    ),

  search: (keyword: string, { page, size, sort }: ListParams = {}) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>('/api/products/search', {
      params: {
        keyword,
        page: page ?? 0,
        ...(size != null ? { size } : {}),
        ...(sort ? { sort } : {}),
      },
    }),

  getFeatured: () =>
    axiosInstance.get<ApiResponse<Product[]>>('/api/products/featured'),
};
