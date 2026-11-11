import axiosInstance from './axiosInstance';
import type { ApiResponse, AuthResponse } from '../types';

interface WhatsappOtpRequestPayload {
  phoneNumber: string;
}

interface WhatsappOtpVerifyPayload {
  phoneNumber: string;
  otp: string;
}

interface WhatsappOtpRequestResponse {
  resendAfterSeconds: number;
  expiresInSeconds: number;
}

interface WhatsappOtpStatusResponse {
  enabled: boolean;
}

export const authApi = {
  googleLogin: (userInfo: Record<string, unknown>) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/google', userInfo),

  getWhatsappStatus: () =>
    axiosInstance.get<ApiResponse<WhatsappOtpStatusResponse>>('/api/auth/whatsapp/status'),

  requestWhatsappOtp: (payload: WhatsappOtpRequestPayload) =>
    axiosInstance.post<ApiResponse<WhatsappOtpRequestResponse>>('/api/auth/whatsapp/send-otp', payload),

  verifyWhatsappOtp: (payload: WhatsappOtpVerifyPayload) =>
    axiosInstance.post<ApiResponse<AuthResponse>>('/api/auth/whatsapp/verify-otp', payload),
};
