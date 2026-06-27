package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.PincodeServiceabilityResponse;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.UserDeliveryEstimate;
import com.kamyaabi.repository.AddressRepository;
import com.kamyaabi.repository.UserDeliveryEstimateRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.DeliveryEstimateService;
import com.kamyaabi.service.ShiprocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryEstimateServiceImpl implements DeliveryEstimateService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final UserDeliveryEstimateRepository estimateRepository;
    private final ShiprocketService shiprocketService;

    /** Default weight (kg) used for serviceability check when no product is known. */
    private static final double DEFAULT_WEIGHT_KG = 0.5;

    @Override
    @Async
    @Transactional
    public void refreshForUser(Long userId) {
        try {
            List<Address> addresses = addressRepository.findByUserId(userId);
            if (addresses.isEmpty()) {
                log.debug("No addresses for user {} — skipping delivery estimate refresh", userId);
                return;
            }

            // Prefer the default address; fall back to the first available one
            Address target = addresses.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                    .findFirst()
                    .orElse(addresses.get(0));

            String pincode = target.getPincode();
            if (pincode == null || !pincode.matches("^[1-9][0-9]{5}$")) {
                log.warn("User {} has invalid pincode '{}' — skipping refresh", userId, pincode);
                return;
            }

            log.info("Refreshing delivery estimate for user {} pincode {}", userId, pincode);
            PincodeServiceabilityResponse result =
                    shiprocketService.checkServiceability(pincode, DEFAULT_WEIGHT_KG);

            // Upsert — one row per user
            UserDeliveryEstimate estimate = estimateRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        var u = userRepository.getReferenceById(userId);
                        return UserDeliveryEstimate.builder().user(u).build();
                    });

            estimate.setPincode(result.pincode());
            estimate.setServiceable(result.serviceable());
            estimate.setCity(result.city());
            estimate.setState(result.state());
            estimate.setEstimatedDays(result.estimatedDays());
            estimate.setCourierName(result.courierName());
            estimate.setCodAvailable(result.codAvailable());
            estimate.setMessage(result.message());
            estimate.setLastRefreshedAt(LocalDateTime.now());

            estimateRepository.save(estimate);
            log.info("Delivery estimate saved for user {} — serviceable={}, pincode={}",
                    userId, result.serviceable(), pincode);

        } catch (Exception e) {
            log.error("Failed to refresh delivery estimate for user {}: {}", userId, e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PincodeServiceabilityResponse> getCachedEstimate(Long userId) {
        return estimateRepository.findByUserId(userId)
                .map(e -> PincodeServiceabilityResponse.builder()
                        .serviceable(Boolean.TRUE.equals(e.getServiceable()))
                        .pincode(e.getPincode())
                        .city(e.getCity())
                        .state(e.getState())
                        .estimatedDays(e.getEstimatedDays())
                        .courierName(e.getCourierName())
                        .codAvailable(e.getCodAvailable())
                        .message(e.getMessage())
                        .build());
    }
}
