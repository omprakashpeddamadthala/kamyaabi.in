package com.kamyaabi.service;

import com.kamyaabi.dto.response.PincodeServiceabilityResponse;

import java.util.Optional;

public interface DeliveryEstimateService {

    void refreshForUser(Long userId);

    Optional<PincodeServiceabilityResponse> getCachedEstimate(Long userId);
}
