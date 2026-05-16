import axiosInstance from './axiosInstance';
import { ApiResponse, ProductTag } from '../types';

export interface ProductTagRequest {
  name: string;
  slug?: string;
}

export const productTagApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<ProductTag[]>>('/api/product-tags'),
};

export const adminProductTagApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<ProductTag[]>>('/api/admin/product-tags'),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<ProductTag>>(`/api/admin/product-tags/${id}`),

  create: (data: ProductTagRequest) =>
    axiosInstance.post<ApiResponse<ProductTag>>('/api/admin/product-tags', data),

  update: (id: number, data: ProductTagRequest) =>
    axiosInstance.put<ApiResponse<ProductTag>>(`/api/admin/product-tags/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/product-tags/${id}`),

  merge: (sourceId: number, targetId: number) =>
    axiosInstance.post<ApiResponse<void>>(`/api/admin/product-tags/${sourceId}/merge/${targetId}`),
};
