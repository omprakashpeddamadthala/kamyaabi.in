package com.kamyaabi.service.impl.whatsapp;

import com.kamyaabi.dto.response.AuthResponse;
import com.kamyaabi.dto.response.WhatsappOtpRequestResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.entity.WhatsappOtpVerification;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.UnauthorizedException;
import com.kamyaabi.mapper.UserMapper;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.repository.WhatsappOtpVerificationRepository;
import com.kamyaabi.security.JwtTokenProvider;
import com.kamyaabi.service.SettingsService;
import com.kamyaabi.service.whatsapp.ChatMitraService;
import com.kamyaabi.service.whatsapp.WhatsappOtpAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@Transactional
public class WhatsappOtpAuthServiceImpl implements WhatsappOtpAuthService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int RESEND_AFTER_SECONDS = 30;
    private static final int MAX_ATTEMPTS = 3;
    private static final int RATE_LIMIT_WINDOW_MINUTES = 10;
    private static final int MAX_REQUESTS_PER_PHONE_PER_WINDOW = 3;
    private static final int MAX_REQUESTS_PER_IP_PER_HOUR = 10;

    private final UserRepository userRepository;
    private final WhatsappOtpVerificationRepository otpRepository;
    private final SettingsService settingsService;
    private final ChatMitraService chatMitraService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;

    public WhatsappOtpAuthServiceImpl(UserRepository userRepository,
                                      WhatsappOtpVerificationRepository otpRepository,
                                      SettingsService settingsService,
                                      ChatMitraService chatMitraService,
                                      JwtTokenProvider jwtTokenProvider,
                                      UserMapper userMapper) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.settingsService = settingsService;
        this.chatMitraService = chatMitraService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
    }

    @Override
    public WhatsappOtpRequestResponse requestOtp(String phoneNumber, String clientIp) {
        requireEnabled();
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        String normalizedIp = normalizeIp(clientIp);

        LocalDateTime now = LocalDateTime.now();
        enforceRequestLimits(normalizedPhone, normalizedIp, now);

        revokePreviousOtps(normalizedPhone, now);

        String otp = generateOtp();
        boolean existingUser = userRepository.findByPhoneNumber(normalizedPhone).isPresent();

        WhatsappOtpVerification verification = new WhatsappOtpVerification();
        verification.setPhoneNumber(normalizedPhone);
        verification.setOtpHash(PASSWORD_ENCODER.encode(otp));
        verification.setPurpose(existingUser
                ? WhatsappOtpVerification.Purpose.LOGIN
                : WhatsappOtpVerification.Purpose.SIGNUP);
        verification.setExpiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES));
        verification.setAttemptCount(0);
        verification.setMaxAttempts(MAX_ATTEMPTS);
        verification.setVerified(false);
        verification.setRequestedFromIp(normalizedIp);
        otpRepository.save(verification);

        chatMitraService.sendOtp(normalizedPhone, otp);
        log.info("Queued WhatsApp OTP for {}", maskPhone(normalizedPhone));

        return WhatsappOtpRequestResponse.builder()
                .resendAfterSeconds(RESEND_AFTER_SECONDS)
                .expiresInSeconds(OTP_EXPIRY_MINUTES * 60)
                .build();
    }

    @Override
    public AuthResponse verifyOtp(String phoneNumber, String otp) {
        requireEnabled();
        String normalizedPhone = normalizePhoneNumber(phoneNumber);
        String normalizedOtp = normalizeOtp(otp);

        WhatsappOtpVerification verification = otpRepository
                .findTopByPhoneNumberAndRevokedAtIsNullAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        normalizedPhone,
                        LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException("OTP is invalid or expired"));

        if (verification.getAttemptCount() >= verification.getMaxAttempts()) {
            throw new AccessDeniedException("Maximum OTP attempts exceeded");
        }

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP is invalid or expired");
        }

        verification.setAttemptCount(verification.getAttemptCount() + 1);

        if (!PASSWORD_ENCODER.matches(normalizedOtp, verification.getOtpHash())) {
            otpRepository.save(verification);
            throw new BadRequestException("OTP is invalid or expired");
        }

        verification.setVerified(true);
        verification.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(verification);

        User user = userRepository.findByPhoneNumber(normalizedPhone)
                .orElseGet(() -> userRepository.findByEmail(buildSyntheticEmail(normalizedPhone))
                        .orElseGet(() -> {
                            User created = User.builder()
                                    .email(buildSyntheticEmail(normalizedPhone))
                                    .phoneNumber(normalizedPhone)
                                    .name("WhatsApp User")
                                    .role(User.Role.USER)
                                    .status(User.Status.ACTIVE)
                                    .build();
                            return userRepository.save(created);
                        }));

        if (user.getPhoneNumber() == null || !normalizedPhone.equals(user.getPhoneNumber())) {
            user.setPhoneNumber(normalizedPhone);
        }
        if (user.getName() == null || user.getName().isBlank() || user.getName().equals("WhatsApp User")) {
            user.setName("WhatsApp User");
        }
        if (!buildSyntheticEmail(normalizedPhone).equals(user.getEmail()) && user.getEmail().startsWith("wa:")) {
            user.setEmail(buildSyntheticEmail(normalizedPhone));
        }
        userRepository.save(user);

        if (user.getStatus() == User.Status.BLOCKED || user.getStatus() == User.Status.REMOVED) {
            throw new UnauthorizedException(user.getStatus() == User.Status.REMOVED
                    ? "Your account has been removed. Please contact support."
                    : "Your account has been blocked. Please contact support.");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isWhatsappOtpEnabled() {
        return settingsService.getBoolean(SettingsService.WHATSAPP_OTP_AUTH_ENABLED,
                SettingsService.DEFAULT_WHATSAPP_OTP_AUTH_ENABLED);
    }

    private void requireEnabled() {
        if (!isWhatsappOtpEnabled()) {
            throw new AccessDeniedException("WhatsApp OTP auth is disabled");
        }
    }

    private void enforceRequestLimits(String phoneNumber, String clientIp, LocalDateTime now) {
        LocalDateTime phoneWindowStart = now.minusMinutes(RATE_LIMIT_WINDOW_MINUTES);
        long phoneCount = otpRepository.countByPhoneNumberAndCreatedAtAfter(phoneNumber, phoneWindowStart);
        if (phoneCount >= MAX_REQUESTS_PER_PHONE_PER_WINDOW) {
            throw new AccessDeniedException("Too many OTP requests for this phone number");
        }
        LocalDateTime ipWindowStart = now.minusHours(1);
        long ipCount = otpRepository.countByRequestedFromIpAndCreatedAtAfter(clientIp, ipWindowStart);
        if (ipCount >= MAX_REQUESTS_PER_IP_PER_HOUR) {
            throw new AccessDeniedException("Too many OTP requests from this network");
        }
    }

    private void revokePreviousOtps(String phoneNumber, LocalDateTime now) {
        List<WhatsappOtpVerification> activeOtps = otpRepository
                .findByPhoneNumberAndRevokedAtIsNullAndVerifiedFalseAndExpiresAtAfter(phoneNumber, now);
        for (WhatsappOtpVerification activeOtp : activeOtps) {
            activeOtp.setRevokedAt(now);
        }
        otpRepository.saveAll(activeOtps);
    }

    private String generateOtp() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            throw new BadRequestException("Phone number is required");
        }
        String digits = phoneNumber.replaceAll("\\D+", "");
        if (!digits.matches("^[1-9]\\d{9,14}$")) {
            throw new BadRequestException("Phone number must be a valid E.164-style number");
        }
        return digits;
    }

    private String normalizeOtp(String otp) {
        if (otp == null) {
            throw new BadRequestException("OTP is required");
        }
        String trimmed = otp.trim();
        if (!trimmed.matches("^\\d{6}$")) {
            throw new BadRequestException("OTP must be a 6-digit code");
        }
        return trimmed;
    }

    private String normalizeIp(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return "unknown";
        }
        return clientIp.trim();
    }

    private String buildSyntheticEmail(String phoneNumber) {
        return "wa+" + phoneNumber + "@kamyaabi.local";
    }

    private String maskPhone(String phoneNumber) {
        if (phoneNumber.length() < 6) {
            return "***";
        }
        return phoneNumber.substring(0, 3) + "***" + phoneNumber.substring(phoneNumber.length() - 3);
    }
}
