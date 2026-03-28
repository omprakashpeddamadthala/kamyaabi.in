import axiosInstance from './axiosInstance';
import { Address, ApiResponse } from '../types';

export interface AddressRequest {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export const addressApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Address[]>>('/api/addresses'),

  create: (data: AddressRequest) =>
    axiosInstance.post<ApiResponse<Address>>('/api/addresses', data),

  update: (id: number, data: AddressRequest) =>
    axiosInstance.put<ApiResponse<Address>>(`/api/addresses/${id}`, data),

  delete: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/addresses/${id}`),
};
