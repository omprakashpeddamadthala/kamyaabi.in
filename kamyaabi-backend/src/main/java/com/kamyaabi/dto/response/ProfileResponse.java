package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long id;
    private String email;
    private String name;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String role;
    private ShippingAddress shippingAddress;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddress {
        private String addressLine1;
        private String addressLine2;
        private String state;
        private String city;
        private String pincode;
        private String country;
    }
}
