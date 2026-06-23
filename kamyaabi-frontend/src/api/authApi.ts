import axiosInstance from './axiosInstance';
import type { ApiResponse, AuthResponse, User } from '../types';

export interface WhatsappOtpRequestPayload {
  phoneNumber: string;
}

export interface WhatsappOtpVerifyPayload {
  phoneNumber: string;
  otp: string;
}

export interface WhatsappOtpRequestResponse {
  resendAfterSeconds: number;
  expiresInSeconds: number;
}

export interface WhatsappOtpStatusResponse {
  enabled: boolean;
}

export const authApi = {
  googleLogin: (userInfo: Record<string, unknown>) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/google', userInfo),

  getCurrentUser: () =>
    axiosInstance.get<ApiResponse<User>>('/api/auth/me'),

  getWhatsappStatus: () =>
    axiosInstance.get<ApiResponse<WhatsappOtpStatusResponse>>('/api/auth/whatsapp/status'),

  requestWhatsappOtp: (payload: WhatsappOtpRequestPayload) =>
    axiosInstance.post<ApiResponse<WhatsappOtpRequestResponse>>('/api/auth/whatsapp/send-otp', payload),

  verifyWhatsappOtp: (payload: WhatsappOtpVerifyPayload) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/whatsapp/verify-otp', payload),
};
