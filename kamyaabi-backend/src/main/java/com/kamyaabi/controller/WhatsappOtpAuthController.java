package com.kamyaabi.controller;

import com.kamyaabi.dto.request.WhatsappOtpRequest;
import com.kamyaabi.dto.request.WhatsappOtpVerifyRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.WhatsappOtpRequestResponse;
import com.kamyaabi.service.whatsapp.WhatsappOtpAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/whatsapp")
@Tag(name = "WhatsApp Auth", description = "WhatsApp OTP authentication")
public class WhatsappOtpAuthController {

    private final WhatsappOtpAuthService whatsappOtpAuthService;

    public WhatsappOtpAuthController(WhatsappOtpAuthService whatsappOtpAuthService) {
        this.whatsappOtpAuthService = whatsappOtpAuthService;
    }

    @PostMapping("/request-otp")
    @Operation(summary = "Request a WhatsApp OTP")
    public ResponseEntity<ApiResponse<WhatsappOtpRequestResponse>> requestOtp(
            @Valid @RequestBody WhatsappOtpRequest request,
            HttpServletRequest httpServletRequest) {
        WhatsappOtpRequestResponse response = whatsappOtpAuthService.requestOtp(
                request.phoneNumber(),
                clientIp(httpServletRequest));
        return ResponseEntity.ok(ApiResponse.success("OTP sent. Check WhatsApp.", response));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify a WhatsApp OTP")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody WhatsappOtpVerifyRequest request) {
        AuthResponse response = whatsappOtpAuthService.verifyOtp(request.phoneNumber(), request.otp());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
