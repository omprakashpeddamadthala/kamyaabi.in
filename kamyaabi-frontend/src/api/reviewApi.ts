import axiosInstance from './axiosInstance';
import type { ApiResponse, PageResponse, Review, ReviewSummary } from '../types';

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
};
