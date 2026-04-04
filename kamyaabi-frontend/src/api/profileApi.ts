import axiosInstance from './axiosInstance';
import { ApiResponse } from '../types';

export interface ShippingAddress {
  addressLine1: string;
  addressLine2: string;
  state: string;
  city: string;
  pincode: string;
  country: string;
}

export interface ProfileResponse {
  id: number;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  shippingAddress: ShippingAddress | null;
}

export interface ProfileRequest {
  firstName: string;
  lastName: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  city?: string;
  pincode?: string;
  country?: string;
}

export const profileApi = {
  getProfile: () =>
    axiosInstance.get<ApiResponse<ProfileResponse>>('/api/profile'),

  updateProfile: (data: ProfileRequest) =>
    axiosInstance.put<ApiResponse<ProfileResponse>>('/api/profile', data),

  getStates: () =>
    axiosInstance.get<ApiResponse<string[]>>('/api/profile/states'),

  getCities: (state: string) =>
    axiosInstance.get<ApiResponse<string[]>>(`/api/profile/states/${encodeURIComponent(state)}/cities`),
};
