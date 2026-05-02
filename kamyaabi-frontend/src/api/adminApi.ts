import axiosInstance from './axiosInstance';
import {
  ApiResponse,
  Product,
  Category,
  Order,
  PageResponse,
  DashboardStats,
  AnalyticsResponse,
  AdminUser,
} from '../types';

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
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
}

export interface AdminProductFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  q?: string;
  categoryId?: number;
  active?: boolean;
}

const buildProductFormData = (data: ProductRequest, images: File[]) => {
  const formData = new FormData();
  const productBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  formData.append('product', productBlob);
  images.forEach((file) => formData.append('images', file));
  return formData;
};

export type UploadProgressHandler = (fraction: number) => void;

export const adminApi = {
  getProducts: (filters: AdminProductFilters = {}) =>
    axiosInstance.get<ApiResponse<PageResponse<Product>>>('/api/admin/products', {
      params: {
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        sortBy: filters.sortBy ?? 'createdAt',
        sortDir: filters.sortDir ?? 'desc',
        ...(filters.q ? { q: filters.q } : {}),
        ...(filters.categoryId != null ? { categoryId: filters.categoryId } : {}),
        ...(filters.active != null ? { active: filters.active } : {}),
      },
    }),

  getProductById: (id: number) =>
    axiosInstance.get<ApiResponse<Product>>(`/api/admin/products/${id}`),

  createProduct: (
    data: ProductRequest,
    images: File[],
    mainImageIndex = 0,
    onUploadProgress?: UploadProgressHandler,
  ) => {
    const formData = buildProductFormData(data, images);
    return axiosInstance.post<ApiResponse<Product>>('/api/admin/products', formData, {
      params: { mainImageIndex },
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgress
        ? (e) => onUploadProgress(e.total ? e.loaded / e.total : 0)
        : undefined,
    });
  },

  updateProduct: (
    id: number,
    data: ProductRequest,
    images: File[] = [],
    mainImageId?: number | null,
    onUploadProgress?: UploadProgressHandler,
  ) => {
    const formData = buildProductFormData(data, images);
    return axiosInstance.put<ApiResponse<Product>>(`/api/admin/products/${id}`, formData, {
      params: mainImageId != null ? { mainImageId } : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgress
        ? (e) => onUploadProgress(e.total ? e.loaded / e.total : 0)
        : undefined,
    });
  },

  deleteProduct: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/products/${id}`),

  restoreProduct: (id: number) =>
    axiosInstance.post<ApiResponse<Product>>(`/api/admin/products/${id}/restore`),

  deleteProductImage: (productId: number, imageId: number) =>
    axiosInstance.delete<ApiResponse<void>>(
      `/api/admin/products/${productId}/images/${imageId}`,
    ),

  setProductStatus: (id: number, active: boolean) =>
    axiosInstance.patch<ApiResponse<Product>>(`/api/admin/products/${id}/status`, {
      active,
    }),

  getCategoriesPaged: (page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<Category>>>('/api/admin/categories', {
      params: { page, size },
    }),

  createCategory: (data: CategoryRequest) =>
    axiosInstance.post<ApiResponse<Category>>('/api/admin/categories', data),

  updateCategory: (id: number, data: CategoryRequest) =>
    axiosInstance.put<ApiResponse<Category>>(`/api/admin/categories/${id}`, data),

  deleteCategory: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/categories/${id}`),

  getAllOrders: (page = 0, size = 10, status?: string) =>
    axiosInstance.get<ApiResponse<PageResponse<Order>>>('/api/admin/orders', {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  updateOrderStatus: (id: number, status: string) =>
    axiosInstance.put<ApiResponse<Order>>(`/api/admin/orders/${id}/status`, { status }),

  getDashboardStats: () =>
    axiosInstance.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats'),

  getAnalytics: (startDate?: string, endDate?: string) =>
    axiosInstance.get<ApiResponse<AnalyticsResponse>>('/api/admin/analytics', {
      params: {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      },
    }),

  getUsers: (page = 0, size = 20, q?: string) =>
    axiosInstance.get<ApiResponse<PageResponse<AdminUser>>>('/api/admin/users', {
      params: {
        page,
        size,
        sortBy: 'createdAt',
        sortDir: 'desc',
        ...(q ? { q } : {}),
      },
    }),

  updateUserRole: (id: number, role: 'USER' | 'ADMIN') =>
    axiosInstance.patch<ApiResponse<AdminUser>>(`/api/admin/users/${id}/role`, { role }),

  updateUserStatus: (id: number, status: 'ACTIVE' | 'BLOCKED' | 'REMOVED') =>
    axiosInstance.patch<ApiResponse<AdminUser>>(`/api/admin/users/${id}/status`, { status }),

  getSettings: () =>
    axiosInstance.get<ApiResponse<Record<string, string>>>('/api/admin/settings'),

  updateSettings: (values: Record<string, string>) =>
    axiosInstance.put<ApiResponse<Record<string, string>>>('/api/admin/settings', values),
};
