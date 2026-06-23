package com.kamyaabi.controller;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.dto.response.WhatsappOtpRequestResponse;
import com.kamyaabi.security.JwtTokenProvider;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.whatsapp.WhatsappOtpAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = WhatsappOtpAuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class WhatsappOtpAuthControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private WhatsappOtpAuthService whatsappOtpAuthService;
    @MockBean private JwtTokenProvider jwtTokenProvider;
    @MockBean private UserRepository userRepository;

    @Test
    void requestOtp_shouldReturnQueuedResponse() throws Exception {
        when(whatsappOtpAuthService.requestOtp(eq("+919876543210"), eq("127.0.0.1")))
                .thenReturn(WhatsappOtpRequestResponse.builder()
                        .resendAfterSeconds(30)
                        .expiresInSeconds(300)
                        .build());

        mockMvc.perform(post("/api/auth/whatsapp/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Forwarded-For", "127.0.0.1")
                        .content("{\"phoneNumber\":\"+919876543210\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent. Check WhatsApp."))
                .andExpect(jsonPath("$.data.resendAfterSeconds").value(30))
                .andExpect(jsonPath("$.data.expiresInSeconds").value(300));

        verify(whatsappOtpAuthService).requestOtp("+919876543210", "127.0.0.1");
    }

    @Test
    void status_shouldReturnEnabledFlag() throws Exception {
        when(whatsappOtpAuthService.isWhatsappOtpEnabled()).thenReturn(true);

        mockMvc.perform(get("/api/auth/whatsapp/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.enabled").value(true));

        verify(whatsappOtpAuthService).isWhatsappOtpEnabled();
    }

    @Test
    void verifyOtp_shouldReturnAuthResponse() throws Exception {
        when(whatsappOtpAuthService.verifyOtp(eq("+919876543210"), eq("123456")))
                .thenReturn(AuthResponse.builder()
                        .token("jwt-token")
                        .user(UserResponse.builder()
                                .id(7L)
                                .email("wa+919876543210@kamyaabi.local")
                                .name("WhatsApp User")
                                .avatarUrl(null)
                                .role("USER")
                                .status("ACTIVE")
                                .build())
                        .build());

        mockMvc.perform(post("/api/auth/whatsapp/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phoneNumber\":\"+919876543210\",\"otp\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.token").value("jwt-token"))
                .andExpect(jsonPath("$.data.user.email").value("wa+919876543210@kamyaabi.local"));

        verify(whatsappOtpAuthService).verifyOtp("+919876543210", "123456");
    }
}
