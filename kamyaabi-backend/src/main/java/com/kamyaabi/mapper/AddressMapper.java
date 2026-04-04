package com.kamyaabi.mapper;

import com.kamyaabi.dto.request.AddressRequest;
import com.kamyaabi.dto.response.AddressResponse;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .street(address.getStreet())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .pincode(address.getPincode())
                .isDefault(address.getIsDefault())
                .build();
    }

    public Address toEntity(AddressRequest request, User user) {
        return Address.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .street(request.getStreet())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .user(user)
                .build();
    }

    public void updateEntity(Address address, AddressRequest request) {
        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setStreet(request.getStreet());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        if (request.getIsDefault() != null) {
            address.setIsDefault(request.getIsDefault());
        }
    }
}
