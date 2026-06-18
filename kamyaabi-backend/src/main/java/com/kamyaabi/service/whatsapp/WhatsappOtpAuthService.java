package com.kamyaabi.service.whatsapp;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.WhatsappOtpRequestResponse;

public interface WhatsappOtpAuthService {

    WhatsappOtpRequestResponse requestOtp(String phoneNumber, String clientIp);

    AuthResponse verifyOtp(String phoneNumber, String otp);
}
