import axiosInstance from './axiosInstance';
import { ApiResponse, Product, Category, Order, PageResponse } from '../types';

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  categoryId: number;
  stock: number;
  weight: string;
  unit: string;
  active?: boolean;
}

export interface CategoryRequest {
  name: string;
  description: string;
  imageUrl: string;
}

export const adminApi = {
  // Products
  createProduct: (data: ProductRequest) =>
    axiosInstance.post<ApiResponse<Product>>('/api/admin/products', data),

  updateProduct: (id: number, data: ProductRequest) =>
    axiosInstance.put<ApiResponse<Product>>(`/api/admin/products/${id}`, data),

  deleteProduct: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/products/${id}`),

  // Categories
  createCategory: (data: CategoryRequest) =>
    axiosInstance.post<ApiResponse<Category>>('/api/admin/categories', data),

  updateCategory: (id: number, data: CategoryRequest) =>
    axiosInstance.put<ApiResponse<Category>>(`/api/admin/categories/${id}`, data),

  deleteCategory: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/categories/${id}`),

  // Orders
  getAllOrders: (page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<Order>>>('/api/admin/orders', {
      params: { page, size },
    }),

  updateOrderStatus: (id: number, status: string) =>
    axiosInstance.put<ApiResponse<Order>>(`/api/admin/orders/${id}/status`, { status }),
};
