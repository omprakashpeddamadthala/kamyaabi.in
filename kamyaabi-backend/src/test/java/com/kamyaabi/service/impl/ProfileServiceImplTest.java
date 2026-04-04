package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProfileRequest;
import com.kamyaabi.dto.response.AddressResponse;
import com.kamyaabi.dto.response.ProfileResponse;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.AddressMapper;
import com.kamyaabi.repository.AddressRepository;
import com.kamyaabi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private AddressMapper addressMapper;

    private ProfileServiceImpl profileService;

    private User user;

    @BeforeEach
    void setUp() {
        profileService = new ProfileServiceImpl(userRepository, addressRepository, addressMapper);

        user = User.builder()
                .id(1L)
                .email("test@kamyaabi.in")
                .name("Test User")
                .firstName("Test")
                .lastName("User")
                .avatarUrl("http://avatar.url")
                .googleId("google-123")
                .role(User.Role.USER)
                .build();
    }

    @Test
    void getProfile_existingUser_shouldReturnProfileResponse() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("test@kamyaabi.in");
        assertThat(response.getFirstName()).isEqualTo("Test");
        assertThat(response.getLastName()).isEqualTo("User");
        assertThat(response.getRole()).isEqualTo("USER");
        assertThat(response.getAddresses()).isEmpty();
    }

    @Test
    void getProfile_notFound_shouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getProfile(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getProfile_withAddresses_shouldIncludeAddressList() {
        Address address = Address.builder()
                .id(10L).fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4")
                .city("Bengaluru").state("Karnataka").pincode("560001")
                .isDefault(true).user(user).build();

        AddressResponse addressResponse = AddressResponse.builder()
                .id(10L).fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4")
                .city("Bengaluru").state("Karnataka").pincode("560001")
                .isDefault(true).build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(address));
        when(addressMapper.toResponse(address)).thenReturn(addressResponse);

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.getAddresses()).hasSize(1);
        assertThat(response.getAddresses().get(0).getFullName()).isEqualTo("Test User");
        assertThat(response.getAddresses().get(0).getCity()).isEqualTo("Bengaluru");
        assertThat(response.getAddresses().get(0).getAddressLine2()).isEqualTo("Apt 4");
        assertThat(response.getAddresses().get(0).getIsDefault()).isTrue();
    }

    @Test
    void getProfile_withoutAddresses_shouldReturnEmptyList() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.getAddresses()).isEmpty();
    }

    @Test
    void updateProfile_nameOnly_shouldUpdateNameFields() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Updated")
                .lastName("Name")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(addressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        profileService.updateProfile(1L, request);

        verify(userRepository).save(any(User.class));
        assertThat(user.getFirstName()).isEqualTo("Updated");
        assertThat(user.getLastName()).isEqualTo("Name");
        assertThat(user.getName()).isEqualTo("Updated Name");
    }

    @Test
    void updateProfile_notFound_shouldThrowException() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .build();

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.updateProfile(999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProfile_shouldTrimNames() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("  Trimmed  ")
                .lastName("  Name  ")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(addressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        profileService.updateProfile(1L, request);

        assertThat(user.getFirstName()).isEqualTo("Trimmed");
        assertThat(user.getLastName()).isEqualTo("Name");
        assertThat(user.getName()).isEqualTo("Trimmed Name");
    }

    @Test
    void updateProfile_shouldReturnProfileWithAddresses() {
        Address address = Address.builder()
                .id(10L).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Bengaluru").state("Karnataka")
                .pincode("560001").isDefault(true).user(user).build();

        AddressResponse addressResponse = AddressResponse.builder()
                .id(10L).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Bengaluru").state("Karnataka")
                .pincode("560001").isDefault(true).build();

        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(address));
        when(addressMapper.toResponse(address)).thenReturn(addressResponse);

        ProfileResponse response = profileService.updateProfile(1L, request);

        assertThat(response.getAddresses()).hasSize(1);
        assertThat(response.getAddresses().get(0).getCity()).isEqualTo("Bengaluru");
    }

    @Test
    void getProfile_shouldIncludeAvatarUrl() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.getAvatarUrl()).isEqualTo("http://avatar.url");
    }
}
