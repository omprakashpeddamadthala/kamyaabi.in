import axiosInstance from './axiosInstance';
import { ApiResponse, Category } from '../types';

export const categoryApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Category[]>>('/api/categories'),

  getById: (id: number) =>
    axiosInstance.get<ApiResponse<Category>>(`/api/categories/${id}`),
};
