package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProfileRequest;
import com.kamyaabi.dto.response.ProfileResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.ProfileService;
import com.kamyaabi.validation.IndianAddressValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final IndianAddressValidator addressValidator;

    public ProfileServiceImpl(UserRepository userRepository, IndianAddressValidator addressValidator) {
        this.userRepository = userRepository;
        this.addressValidator = addressValidator;
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        log.debug("Fetching profile for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return toProfileResponse(user);
    }

    @Override
    public ProfileResponse updateProfile(Long userId, ProfileRequest request) {
        log.info("Updating profile for user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setName(request.getFirstName().trim() + " " + request.getLastName().trim());

        if (hasShippingAddress(request)) {
            validateShippingAddress(request);
            user.setShippingAddressLine1(request.getAddressLine1().trim());
            user.setShippingAddressLine2(
                    request.getAddressLine2() != null ? request.getAddressLine2().trim() : null);
            user.setShippingState(request.getState());
            user.setShippingCity(request.getCity());
            user.setShippingPincode(request.getPincode());
            user.setShippingCountry("India");
        }

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", saved.getId());
        return toProfileResponse(saved);
    }

    private boolean hasShippingAddress(ProfileRequest request) {
        return request.getAddressLine1() != null && !request.getAddressLine1().isBlank()
                || request.getState() != null && !request.getState().isBlank()
                || request.getCity() != null && !request.getCity().isBlank()
                || request.getPincode() != null && !request.getPincode().isBlank();
    }

    private void validateShippingAddress(ProfileRequest request) {
        if (request.getAddressLine1() == null || request.getAddressLine1().isBlank()) {
            throw new BadRequestException("Address Line 1 is required when providing shipping address");
        }
        if (request.getState() == null || request.getState().isBlank()) {
            throw new BadRequestException("State is required when providing shipping address");
        }
        if (request.getCity() == null || request.getCity().isBlank()) {
            throw new BadRequestException("City is required when providing shipping address");
        }
        if (request.getPincode() == null || request.getPincode().isBlank()) {
            throw new BadRequestException("Pincode is required when providing shipping address");
        }
        if (!addressValidator.isValidState(request.getState())) {
            throw new BadRequestException("Invalid state: " + request.getState());
        }
        if (!addressValidator.isValidCityForState(request.getState(), request.getCity())) {
            throw new BadRequestException("Invalid city '" + request.getCity() + "' for state '" + request.getState() + "'");
        }
        if (!request.getPincode().matches("^[1-9][0-9]{5}$")) {
            throw new BadRequestException("Pincode must be a valid 6-digit Indian pincode");
        }
    }

    private ProfileResponse toProfileResponse(User user) {
        ProfileResponse.ShippingAddress shippingAddress = null;
        if (user.getShippingAddressLine1() != null) {
            shippingAddress = ProfileResponse.ShippingAddress.builder()
                    .addressLine1(user.getShippingAddressLine1())
                    .addressLine2(user.getShippingAddressLine2())
                    .state(user.getShippingState())
                    .city(user.getShippingCity())
                    .pincode(user.getShippingPincode())
                    .country(user.getShippingCountry())
                    .build();
        }

        return ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .shippingAddress(shippingAddress)
                .build();
    }
}
