package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProfileRequest;
import com.kamyaabi.dto.response.ProfileResponse;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.validation.IndianAddressValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private IndianAddressValidator addressValidator;

    @InjectMocks private ProfileServiceImpl profileService;

    private User user;

    @BeforeEach
    void setUp() {
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

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("test@kamyaabi.in");
        assertThat(response.getFirstName()).isEqualTo("Test");
        assertThat(response.getLastName()).isEqualTo("User");
        assertThat(response.getRole()).isEqualTo("USER");
    }

    @Test
    void getProfile_notFound_shouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getProfile(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getProfile_withShippingAddress_shouldIncludeAddress() {
        user.setShippingAddressLine1("123 Main St");
        user.setShippingAddressLine2("Apt 4");
        user.setShippingState("Karnataka");
        user.setShippingCity("Bengaluru");
        user.setShippingPincode("560001");
        user.setShippingCountry("India");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.getShippingAddress()).isNotNull();
        assertThat(response.getShippingAddress().getAddressLine1()).isEqualTo("123 Main St");
        assertThat(response.getShippingAddress().getState()).isEqualTo("Karnataka");
        assertThat(response.getShippingAddress().getCity()).isEqualTo("Bengaluru");
        assertThat(response.getShippingAddress().getPincode()).isEqualTo("560001");
        assertThat(response.getShippingAddress().getCountry()).isEqualTo("India");
    }

    @Test
    void getProfile_withoutShippingAddress_shouldReturnNullAddress() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        ProfileResponse response = profileService.getProfile(1L);

        assertThat(response.getShippingAddress()).isNull();
    }

    @Test
    void updateProfile_nameOnly_shouldUpdateNameFields() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Updated")
                .lastName("Name")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        ProfileResponse response = profileService.updateProfile(1L, request);

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
    void updateProfile_withValidAddress_shouldUpdateAddress() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .addressLine2("Apt 4")
                .state("Karnataka")
                .city("Bengaluru")
                .pincode("560001")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(addressValidator.isValidState("Karnataka")).thenReturn(true);
        when(addressValidator.isValidCityForState("Karnataka", "Bengaluru")).thenReturn(true);

        profileService.updateProfile(1L, request);

        assertThat(user.getShippingAddressLine1()).isEqualTo("123 Main St");
        assertThat(user.getShippingState()).isEqualTo("Karnataka");
        assertThat(user.getShippingCity()).isEqualTo("Bengaluru");
        assertThat(user.getShippingPincode()).isEqualTo("560001");
        assertThat(user.getShippingCountry()).isEqualTo("India");
    }

    @Test
    void updateProfile_invalidState_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .state("InvalidState")
                .city("SomeCity")
                .pincode("560001")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressValidator.isValidState("InvalidState")).thenReturn(false);

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid state");
    }

    @Test
    void updateProfile_invalidCityForState_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .state("Karnataka")
                .city("InvalidCity")
                .pincode("560001")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressValidator.isValidState("Karnataka")).thenReturn(true);
        when(addressValidator.isValidCityForState("Karnataka", "InvalidCity")).thenReturn(false);

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid city");
    }

    @Test
    void updateProfile_invalidPincode_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .state("Karnataka")
                .city("Bengaluru")
                .pincode("12345")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressValidator.isValidState("Karnataka")).thenReturn(true);
        when(addressValidator.isValidCityForState("Karnataka", "Bengaluru")).thenReturn(true);

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Pincode must be a valid 6-digit Indian pincode");
    }

    @Test
    void updateProfile_missingAddressLine1_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .state("Karnataka")
                .city("Bengaluru")
                .pincode("560001")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Address Line 1 is required");
    }

    @Test
    void updateProfile_missingState_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .city("Bengaluru")
                .pincode("560001")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("State is required");
    }

    @Test
    void updateProfile_missingCity_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .state("Karnataka")
                .pincode("560001")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("City is required");
    }

    @Test
    void updateProfile_missingPincode_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .state("Karnataka")
                .city("Bengaluru")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Pincode is required");
    }

    @Test
    void updateProfile_pincodeStartingWithZero_shouldThrowBadRequest() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Test")
                .lastName("User")
                .addressLine1("123 Main St")
                .state("Karnataka")
                .city("Bengaluru")
                .pincode("012345")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressValidator.isValidState("Karnataka")).thenReturn(true);
        when(addressValidator.isValidCityForState("Karnataka", "Bengaluru")).thenReturn(true);

        assertThatThrownBy(() -> profileService.updateProfile(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Pincode must be a valid 6-digit Indian pincode");
    }
}
