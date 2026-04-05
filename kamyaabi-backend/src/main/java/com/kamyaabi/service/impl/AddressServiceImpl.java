package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.AddressRequest;
import com.kamyaabi.dto.response.AddressResponse;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.AddressMapper;
import com.kamyaabi.repository.AddressRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.AddressService;
import com.kamyaabi.validation.IndianAddressValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final AddressMapper addressMapper;
    private final IndianAddressValidator addressValidator;

    public AddressServiceImpl(AddressRepository addressRepository,
                              UserRepository userRepository,
                              AddressMapper addressMapper,
                              IndianAddressValidator addressValidator) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.addressMapper = addressMapper;
        this.addressValidator = addressValidator;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(Long userId) {
        log.debug("Fetching addresses for user: {}", userId);
        return addressRepository.findByUserId(userId).stream()
                .map(addressMapper::toResponse)
                .toList();
    }

    @Override
    public AddressResponse createAddress(Long userId, AddressRequest request) {
        log.info("Creating address for user: {}", userId);
        validateAddress(request);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Address address = addressMapper.toEntity(request, user);
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            clearOtherDefaults(userId, null);
        }
        Address saved = addressRepository.save(address);
        log.info("Address created with id: {}", saved.getId());
        return addressMapper.toResponse(saved);
    }

    @Override
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        log.info("Updating address {} for user: {}", addressId, userId);
        validateAddress(request);

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        addressMapper.updateEntity(address, request);
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            clearOtherDefaults(userId, addressId);
        }
        Address saved = addressRepository.save(address);
        log.info("Address updated: {}", saved.getId());
        return addressMapper.toResponse(saved);
    }

    @Override
    public void deleteAddress(Long userId, Long addressId) {
        log.info("Deleting address {} for user: {}", addressId, userId);
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        addressRepository.delete(address);
        log.info("Address deleted: {}", addressId);
    }

    @Override
    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        log.info("Setting default address {} for user: {}", addressId, userId);
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        clearOtherDefaults(userId, addressId);
        address.setIsDefault(true);
        Address saved = addressRepository.save(address);
        log.info("Default address set to: {}", saved.getId());
        return addressMapper.toResponse(saved);
    }

    private void clearOtherDefaults(Long userId, Long excludeAddressId) {
        addressRepository.findByUserId(userId).stream()
                .filter(a -> !a.getId().equals(excludeAddressId))
                .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                .forEach(a -> {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                });
    }

    private void validateAddress(AddressRequest request) {
        if (!addressValidator.isValidState(request.getState())) {
            throw new BadRequestException("Invalid state: " + request.getState());
        }
        if (!addressValidator.isValidCityForState(request.getState(), request.getCity())) {
            throw new BadRequestException(
                    "Invalid city '" + request.getCity() + "' for state '" + request.getState() + "'");
        }
    }
}
