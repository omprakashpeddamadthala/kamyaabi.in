package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProfileRequest;
import com.kamyaabi.dto.response.AddressResponse;
import com.kamyaabi.dto.response.ProfileResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.AddressMapper;
import com.kamyaabi.repository.AddressRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.ProfileService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final AddressMapper addressMapper;

    public ProfileServiceImpl(UserRepository userRepository,
                              AddressRepository addressRepository,
                              AddressMapper addressMapper) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.addressMapper = addressMapper;
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

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setName(request.firstName().trim() + " " + request.lastName().trim());

        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", saved.getId());
        return toProfileResponse(saved);
    }

    private ProfileResponse toProfileResponse(User user) {
        List<AddressResponse> addresses = addressRepository.findByUserId(user.getId()).stream()
                .map(addressMapper::toResponse)
                .toList();

        return ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .addresses(addresses)
                .build();
    }
}
