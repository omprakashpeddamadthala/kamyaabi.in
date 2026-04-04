package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
    private List<AddressResponse> addresses;
}
