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

export const authApi = {
  googleLogin: (userInfo: Record<string, unknown>) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/google', userInfo),

  getCurrentUser: () =>
    axiosInstance.get<ApiResponse<User>>('/api/auth/me'),

  requestWhatsappOtp: (payload: WhatsappOtpRequestPayload) =>
    axiosInstance.post<ApiResponse<WhatsappOtpRequestResponse>>('/api/auth/whatsapp/request-otp', payload),

  verifyWhatsappOtp: (payload: WhatsappOtpVerifyPayload) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/whatsapp/verify-otp', payload),
};
