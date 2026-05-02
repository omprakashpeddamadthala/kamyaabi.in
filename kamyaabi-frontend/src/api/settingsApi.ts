import axiosInstance from './axiosInstance';
import { ApiResponse } from '../types';

export interface PublicSettings {
  products_per_page?: string;
  show_bought_recently_badge?: string;
}

export const settingsApi = {
  getPublicSettings: () =>
    axiosInstance.get<ApiResponse<PublicSettings>>('/api/settings/public'),
};
