import axiosInstance from './axiosInstance';
import type { ApiResponse } from '../types';

export interface PublicSettings {
  products_per_page?: string;
  show_bought_recently_badge?: string;
  amazon_store_url?: string;
  whatsapp_otp_auth_enabled?: string;
}

export const settingsApi = {
  getPublicSettings: () =>
    axiosInstance.get<ApiResponse<PublicSettings>>('/api/settings/public'),
};
