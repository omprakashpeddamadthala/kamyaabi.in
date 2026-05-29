import axiosInstance from './axiosInstance';
import { ApiResponse } from '../types';

export interface HeroBanner {
  id: number;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  altText?: string | null;
  linkUrl?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface HeroBannerRequest {
  title?: string;
  subtitle?: string;
  altText?: string;
  linkUrl?: string;
  displayOrder?: number;
  active?: boolean;
}

const buildFormData = (data: HeroBannerRequest, image?: File | null) => {
  const formData = new FormData();
  formData.append('banner', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (image) formData.append('image', image);
  return formData;
};

export const heroBannerApi = {
  // Public
  getActive: () =>
    axiosInstance.get<ApiResponse<HeroBanner[]>>('/api/hero-banners'),

  // Admin
  list: () =>
    axiosInstance.get<ApiResponse<HeroBanner[]>>('/api/admin/hero-banners'),

  create: (data: HeroBannerRequest, image: File) =>
    axiosInstance.post<ApiResponse<HeroBanner>>('/api/admin/hero-banners', buildFormData(data, image), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: HeroBannerRequest, image?: File | null) =>
    axiosInstance.put<ApiResponse<HeroBanner>>(`/api/admin/hero-banners/${id}`, buildFormData(data, image), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  setStatus: (id: number, active: boolean) =>
    axiosInstance.patch<ApiResponse<HeroBanner>>(`/api/admin/hero-banners/${id}/status`, { active }),

  reorder: (orderedIds: number[]) =>
    axiosInstance.put<ApiResponse<HeroBanner[]>>('/api/admin/hero-banners/reorder', { orderedIds }),

  remove: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/hero-banners/${id}`),
};
