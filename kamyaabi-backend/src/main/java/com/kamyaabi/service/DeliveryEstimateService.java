package com.kamyaabi.service;

import com.kamyaabi.dto.response.PincodeServiceabilityResponse;

import java.util.Optional;

public interface DeliveryEstimateService {

    /**
     * Asynchronously fetches the Shiprocket serviceability for the user's default
     * address and saves (or updates) the result in the database.
     * Safe to call from any transactional context — runs in a separate thread.
     *
     * @param userId the user whose default address pincode will be checked
     */
    void refreshForUser(Long userId);

    /**
     * Returns the cached delivery estimate for the user from the database.
     * Returns empty if no estimate has been computed yet.
     *
     * @param userId the authenticated user
     */
    Optional<PincodeServiceabilityResponse> getCachedEstimate(Long userId);
}
