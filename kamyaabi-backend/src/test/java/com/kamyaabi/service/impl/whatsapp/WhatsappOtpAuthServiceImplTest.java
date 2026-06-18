package com.kamyaabi.service.impl.whatsapp;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.UserResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.entity.WhatsappOtpVerification;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.repository.WhatsappOtpVerificationRepository;
import com.kamyaabi.security.JwtTokenProvider;
import com.kamyaabi.service.SettingsService;
import com.kamyaabi.service.whatsapp.ChatMitraService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WhatsappOtpAuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private WhatsappOtpVerificationRepository otpRepository;
    @Mock private SettingsService settingsService;
    @Mock private ChatMitraService chatMitraService;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private com.kamyaabi.mapper.UserMapper userMapper;

    @InjectMocks private WhatsappOtpAuthServiceImpl service;

    @Test
    void requestOtp_whenFeatureDisabled_shouldReject() {
        when(settingsService.getBoolean(SettingsService.WHATSAPP_OTP_AUTH_ENABLED, false))
                .thenReturn(false);

        assertThatThrownBy(() -> service.requestOtp("+919876543210", "127.0.0.1"))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(otpRepository, chatMitraService, userRepository);
    }

    @Test
    void requestOtp_whenEnabled_shouldPersistOtpAndSendTemplate() {
        when(settingsService.getBoolean(SettingsService.WHATSAPP_OTP_AUTH_ENABLED, false))
                .thenReturn(true);
        when(userRepository.findByPhoneNumber("919876543210")).thenReturn(Optional.empty());
        when(otpRepository.countByPhoneNumberAndCreatedAtAfter(anyString(), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(otpRepository.countByRequestedFromIpAndCreatedAtAfter(anyString(), any(LocalDateTime.class)))
                .thenReturn(0L);
        when(otpRepository.findByPhoneNumberAndRevokedAtIsNullAndVerifiedFalseAndExpiresAtAfter(
                anyString(), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(otpRepository.save(any(WhatsappOtpVerification.class))).thenAnswer(inv -> inv.getArgument(0));
        when(otpRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);

        var response = service.requestOtp("+919876543210", "127.0.0.1");

        verify(chatMitraService).sendOtp(org.mockito.ArgumentMatchers.eq("919876543210"), otpCaptor.capture());
        assertThat(otpCaptor.getValue()).matches("\\d{6}");
        assertThat(response.resendAfterSeconds()).isEqualTo(30);
        assertThat(response.expiresInSeconds()).isEqualTo(300);
    }

    @Test
    void verifyOtp_whenCodeMatches_shouldCreateSession() {
        when(settingsService.getBoolean(SettingsService.WHATSAPP_OTP_AUTH_ENABLED, false))
                .thenReturn(true);
        WhatsappOtpVerification verification = new WhatsappOtpVerification();
        verification.setPhoneNumber("919876543210");
        verification.setOtpHash(new BCryptPasswordEncoder().encode("123456"));
        verification.setAttemptCount(0);
        verification.setMaxAttempts(5);
        verification.setVerified(false);
        verification.setPurpose(WhatsappOtpVerification.Purpose.LOGIN);
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        when(otpRepository.findTopByPhoneNumberAndRevokedAtIsNullAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                org.mockito.ArgumentMatchers.eq("919876543210"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(verification));
        when(otpRepository.save(any(WhatsappOtpVerification.class))).thenAnswer(inv -> inv.getArgument(0));

        User user = User.builder()
                .id(7L)
                .email("wa+919876543210@kamyaabi.local")
                .phoneNumber("919876543210")
                .name("WhatsApp User")
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .build();
        when(userRepository.findByPhoneNumber("919876543210")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("wa+919876543210@kamyaabi.local")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateToken(7L, "wa+919876543210@kamyaabi.local", "USER")).thenReturn("jwt-token");
        when(userMapper.toResponse(user)).thenReturn(UserResponse.builder()
                .id(7L)
                .email("wa+919876543210@kamyaabi.local")
                .name("WhatsApp User")
                .avatarUrl(null)
                .role("USER")
                .status("ACTIVE")
                .build());

        AuthResponse response = service.verifyOtp("+919876543210", "123456");

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("wa+919876543210@kamyaabi.local");
        verify(otpRepository).save(any(WhatsappOtpVerification.class));
        verify(userRepository, atLeastOnce()).save(any(User.class));
        verify(chatMitraService, never()).sendOtp(anyString(), anyString());
    }
}
