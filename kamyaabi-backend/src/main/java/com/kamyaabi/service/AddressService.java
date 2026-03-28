package com.kamyaabi.service;

import com.kamyaabi.dto.request.AddressRequest;
import com.kamyaabi.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {
    List<AddressResponse> getUserAddresses(Long userId);
    AddressResponse createAddress(Long userId, AddressRequest request);
    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);
    void deleteAddress(Long userId, Long addressId);
}
