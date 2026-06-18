package com.kamyaabi.repository;

import com.kamyaabi.entity.WhatsappOtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WhatsappOtpVerificationRepository
        extends JpaRepository<WhatsappOtpVerification, Long> {

    Optional<WhatsappOtpVerification> findTopByPhoneNumberAndRevokedAtIsNullAndVerifiedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phoneNumber,
            LocalDateTime now);

    List<WhatsappOtpVerification> findByPhoneNumberAndRevokedAtIsNullAndVerifiedFalseAndExpiresAtAfter(
            String phoneNumber,
            LocalDateTime now);

    long countByPhoneNumberAndCreatedAtAfter(
            String phoneNumber,
            LocalDateTime createdAtAfter);

    long countByRequestedFromIpAndCreatedAtAfter(
            String requestedFromIp,
            LocalDateTime createdAtAfter);
}
