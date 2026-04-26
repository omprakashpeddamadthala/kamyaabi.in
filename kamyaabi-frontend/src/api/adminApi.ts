import axiosInstance from './axiosInstance';
import { ApiResponse, Product, Category, Order, PageResponse } from '../types';

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
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

const buildProductFormData = (data: ProductRequest, images: File[]) => {
  const formData = new FormData();
  const productBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  formData.append('product', productBlob);
  images.forEach((file) => formData.append('images', file));
  return formData;
};

export const adminApi = {
  // Products
  createProduct: (data: ProductRequest, images: File[], mainImageIndex = 0) => {
    const formData = buildProductFormData(data, images);
    return axiosInstance.post<ApiResponse<Product>>('/api/admin/products', formData, {
      params: { mainImageIndex },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateProduct: (
    id: number,
    data: ProductRequest,
    images: File[] = [],
    mainImageId?: number | null,
  ) => {
    const formData = buildProductFormData(data, images);
    return axiosInstance.put<ApiResponse<Product>>(`/api/admin/products/${id}`, formData, {
      params: mainImageId != null ? { mainImageId } : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteProduct: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/products/${id}`),

  deleteProductImage: (productId: number, imageId: number) =>
    axiosInstance.delete<ApiResponse<void>>(
      `/api/admin/products/${productId}/images/${imageId}`,
    ),

  // Categories
  createCategory: (data: CategoryRequest) =>
    axiosInstance.post<ApiResponse<Category>>('/api/admin/categories', data),

  updateCategory: (id: number, data: CategoryRequest) =>
    axiosInstance.put<ApiResponse<Category>>(`/api/admin/categories/${id}`, data),

  deleteCategory: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/categories/${id}`),

  // Orders
  getAllOrders: (page = 0, size = 10, status?: string) =>
    axiosInstance.get<ApiResponse<PageResponse<Order>>>('/api/admin/orders', {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  updateOrderStatus: (id: number, status: string) =>
    axiosInstance.put<ApiResponse<Order>>(`/api/admin/orders/${id}/status`, { status }),
};
