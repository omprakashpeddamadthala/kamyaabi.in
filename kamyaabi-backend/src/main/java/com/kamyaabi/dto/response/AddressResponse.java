package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record AddressResponse(
        Long id,
        String fullName,
        String phone,
        String street,
        String addressLine2,
        String city,
        String state,
        String pincode,
        Boolean isDefault
) {
}
