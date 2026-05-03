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
                .fullName(request.fullName())
                .phone(request.phone())
                .street(request.street())
                .addressLine2(request.addressLine2())
                .city(request.city())
                .state(request.state())
                .pincode(request.pincode())
                .isDefault(request.isDefault() != null ? request.isDefault() : false)
                .user(user)
                .build();
    }

    public void updateEntity(Address address, AddressRequest request) {
        address.setFullName(request.fullName());
        address.setPhone(request.phone());
        address.setStreet(request.street());
        address.setAddressLine2(request.addressLine2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setPincode(request.pincode());
        if (request.isDefault() != null) {
            address.setIsDefault(request.isDefault());
        }
    }
}
