package com.kamyaabi.controller;

import com.kamyaabi.dto.request.AddressRequest;
import com.kamyaabi.dto.response.AddressResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.AddressService;
import com.kamyaabi.validation.IndianAddressValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressControllerTest {

    @Mock private AddressService addressService;
    @Mock private CurrentUser currentUser;
    @Mock private IndianAddressValidator addressValidator;

    @InjectMocks private AddressController addressController;

    private final AddressResponse addressResponse = AddressResponse.builder()
            .id(1L).fullName("Test User").phone("9876543210")
            .street("123 Main St").addressLine2("Apt 4").city("Mumbai")
            .state("Maharashtra").pincode("400001").build();

    @Test
    void getUserAddresses_shouldReturnList() {
        when(currentUser.getUserId()).thenReturn(1L);
        when(addressService.getUserAddresses(1L)).thenReturn(List.of(addressResponse));

        ResponseEntity<?> response = addressController.getUserAddresses();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void createAddress_shouldReturnCreatedAddress() {
        AddressRequest request = AddressRequest.builder().fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4").city("Mumbai")
                .state("Maharashtra").pincode("400001").build();
        when(currentUser.getUserId()).thenReturn(1L);
        when(addressService.createAddress(1L, request)).thenReturn(addressResponse);

        ResponseEntity<?> response = addressController.createAddress(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void updateAddress_shouldReturnUpdatedAddress() {
        AddressRequest request = AddressRequest.builder().fullName("Updated").phone("9876543210")
                .street("New St").city("Delhi").state("Delhi").pincode("110001").build();
        when(currentUser.getUserId()).thenReturn(1L);
        when(addressService.updateAddress(1L, 1L, request)).thenReturn(addressResponse);

        ResponseEntity<?> response = addressController.updateAddress(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void deleteAddress_shouldReturn200() {
        when(currentUser.getUserId()).thenReturn(1L);

        ResponseEntity<?> response = addressController.deleteAddress(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(addressService).deleteAddress(1L, 1L);
    }

    @Test
    void getStates_shouldReturnListOfStates() {
        List<String> states = List.of("Karnataka", "Tamil Nadu", "Maharashtra");
        when(addressValidator.getStates()).thenReturn(states);

        ResponseEntity<?> response = addressController.getStates();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getCities_shouldReturnListOfCities() {
        List<String> cities = List.of("Bengaluru", "Mysuru", "Mangaluru");
        when(addressValidator.getCitiesForState("Karnataka")).thenReturn(cities);

        ResponseEntity<?> response = addressController.getCities("Karnataka");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void setDefaultAddress_shouldReturnUpdatedAddress() {
        AddressResponse defaultResponse = AddressResponse.builder()
                .id(1L).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai")
                .state("Maharashtra").pincode("400001").isDefault(true).build();
        when(currentUser.getUserId()).thenReturn(1L);
        when(addressService.setDefaultAddress(1L, 1L)).thenReturn(defaultResponse);

        ResponseEntity<?> response = addressController.setDefaultAddress(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(addressService).setDefaultAddress(1L, 1L);
    }
}
