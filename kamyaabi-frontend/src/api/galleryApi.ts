import axiosInstance from './axiosInstance';
import { ApiResponse } from '../types';

export interface GalleryImage {
  id: number;
  imageUrl: string;
  publicId: string | null;
  displayOrder: number;
  uploadedAt: string;
}

export const galleryApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<GalleryImage[]>>('/api/gallery'),

  upload: (image: File, displayOrder = 0) => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('displayOrder', String(displayOrder));
    return axiosInstance.post<ApiResponse<GalleryImage>>(
      '/api/admin/gallery/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  delete: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/gallery/${id}`),
};
