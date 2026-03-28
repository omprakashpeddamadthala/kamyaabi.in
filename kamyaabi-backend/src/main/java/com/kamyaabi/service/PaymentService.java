package com.kamyaabi.service;

import com.kamyaabi.dto.request.PaymentVerifyRequest;
import com.kamyaabi.dto.response.PaymentResponse;
import com.kamyaabi.dto.response.RazorpayOrderResponse;

public interface PaymentService {
    RazorpayOrderResponse createRazorpayOrder(Long orderId);
    PaymentResponse verifyPayment(PaymentVerifyRequest request);
}
