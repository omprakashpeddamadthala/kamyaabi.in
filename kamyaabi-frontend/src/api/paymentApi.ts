import axiosInstance from './axiosInstance';
import { ApiResponse, RazorpayOrder, Payment } from '../types';

export const paymentApi = {
  createOrder: (orderId: number) =>
    axiosInstance.post<ApiResponse<RazorpayOrder>>('/api/payments/create-order', null, {
      params: { orderId },
    }),

  verify: (data: {
    orderId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    axiosInstance.post<ApiResponse<Payment>>('/api/payments/verify', data),
};
