import axiosInstance from './axiosInstance';
import type { ApiResponse, PageResponse, Review, ReviewSummary, Faq } from '../types';

export const reviewApi = {
  list: (productId: number, page = 0, size = 10) =>
    axiosInstance.get<ApiResponse<PageResponse<Review>>>(
      `/api/products/${productId}/reviews`,
      { params: { page, size } },
    ),

  summary: (productId: number) =>
    axiosInstance.get<ApiResponse<ReviewSummary>>(
      `/api/products/${productId}/reviews/summary`,
    ),

  create: (productId: number, data: { rating: number; title?: string; text: string }, images?: File[]) => {
    const formData = new FormData();
    const reviewBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('review', reviewBlob);
    if (images) {
      images.forEach((file) => formData.append('images', file));
    }
    return axiosInstance.post<ApiResponse<Review>>(
      `/api/products/${productId}/reviews`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  update: (productId: number, reviewId: number, data: { rating: number; title?: string; text: string }, images?: File[]) => {
    const formData = new FormData();
    const reviewBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('review', reviewBlob);
    if (images) {
      images.forEach((file) => formData.append('images', file));
    }
    return axiosInstance.put<ApiResponse<Review>>(
      `/api/products/${productId}/reviews/${reviewId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  deleteReview: (reviewId: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/admin/reviews/${reviewId}`),

  listAll: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<PageResponse<Review>>>('/api/admin/reviews', {
      params: { page, size },
    }),

  getFaqs: (productId: number) =>
    axiosInstance.get<ApiResponse<Faq[]>>(`/api/products/${productId}/faqs`),
};
