import axiosInstance from './axiosInstance';
import { Address, ApiResponse } from '../types';

export interface ProfileResponse {
  id: number;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  addresses: Address[];
}

export interface ProfileRequest {
  firstName: string;
  lastName: string;
}

export const profileApi = {
  getProfile: () =>
    axiosInstance.get<ApiResponse<ProfileResponse>>('/api/profile'),

  updateProfile: (data: ProfileRequest) =>
    axiosInstance.put<ApiResponse<ProfileResponse>>('/api/profile', data),
};
