import axiosInstance from './axiosInstance';
import { ApiResponse, AuthResponse, User } from '../types';

export const authApi = {
  googleLogin: (userInfo: Record<string, unknown>) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/google', userInfo),

  getCurrentUser: () =>
    axiosInstance.get<ApiResponse<User>>('/api/auth/me'),
};
