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
import com.kamyaabi.validation.IndianAddressValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressServiceImplTest {

    @Mock private AddressRepository addressRepository;
    @Mock private UserRepository userRepository;
    @Mock private AddressMapper addressMapper;
    @Mock private IndianAddressValidator addressValidator;

    private AddressServiceImpl addressService;

    private User user;
    private Address address;
    private AddressResponse addressResponse;
    private AddressRequest addressRequest;

    @BeforeEach
    void setUp() {
        addressService = new AddressServiceImpl(addressRepository, userRepository, addressMapper, addressValidator);

        user = User.builder().id(1L).email("test@kamyaabi.in").name("Test").role(User.Role.USER).build();
        address = Address.builder().id(1L).user(user).fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(false).build();
        addressResponse = AddressResponse.builder().id(1L).fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(false).build();
        addressRequest = AddressRequest.builder().fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4").city("Mumbai").state("Maharashtra")
                .pincode("400001").build();
    }

    @Test
    void getUserAddresses_shouldReturnList() {
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(address));
        when(addressMapper.toResponse(address)).thenReturn(addressResponse);

        List<AddressResponse> result = addressService.getUserAddresses(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFullName()).isEqualTo("Test User");
        assertThat(result.get(0).getAddressLine2()).isEqualTo("Apt 4");
    }

    @Test
    void createAddress_shouldValidateAndReturnCreatedAddress() {
        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "Mumbai")).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressMapper.toEntity(addressRequest, user)).thenReturn(address);
        when(addressRepository.save(address)).thenReturn(address);
        when(addressMapper.toResponse(address)).thenReturn(addressResponse);

        AddressResponse result = addressService.createAddress(1L, addressRequest);

        assertThat(result.getFullName()).isEqualTo("Test User");
        verify(addressValidator).isValidState("Maharashtra");
        verify(addressValidator).isValidCityForState("Maharashtra", "Mumbai");
        verify(addressRepository).save(address);
    }

    @Test
    void createAddress_invalidState_shouldThrowBadRequest() {
        when(addressValidator.isValidState("Maharashtra")).thenReturn(false);

        assertThatThrownBy(() -> addressService.createAddress(1L, addressRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid state");
    }

    @Test
    void createAddress_invalidCityForState_shouldThrowBadRequest() {
        AddressRequest badCityRequest = AddressRequest.builder().fullName("Test").phone("9876543210")
                .street("St").city("InvalidCity").state("Maharashtra").pincode("400001").build();

        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "InvalidCity")).thenReturn(false);

        assertThatThrownBy(() -> addressService.createAddress(1L, badCityRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid city");
    }

    @Test
    void createAddress_userNotFound_shouldThrowException() {
        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "Mumbai")).thenReturn(true);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.createAddress(999L, addressRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateAddress_shouldValidateAndReturnUpdatedAddress() {
        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "Mumbai")).thenReturn(true);
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(addressRepository.save(any(Address.class))).thenReturn(address);
        when(addressMapper.toResponse(any(Address.class))).thenReturn(addressResponse);

        AddressResponse result = addressService.updateAddress(1L, 1L, addressRequest);

        assertThat(result.getFullName()).isEqualTo("Test User");
        verify(addressValidator).isValidState("Maharashtra");
        verify(addressMapper).updateEntity(address, addressRequest);
    }

    @Test
    void updateAddress_invalidState_shouldThrowBadRequest() {
        AddressRequest badRequest = AddressRequest.builder().fullName("Test").phone("9876543210")
                .street("St").city("Mumbai").state("InvalidState").pincode("400001").build();

        when(addressValidator.isValidState("InvalidState")).thenReturn(false);

        assertThatThrownBy(() -> addressService.updateAddress(1L, 1L, badRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid state");
    }

    @Test
    void updateAddress_notFound_shouldThrowException() {
        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "Mumbai")).thenReturn(true);
        when(addressRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.updateAddress(1L, 999L, addressRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateAddress_wrongUser_shouldThrowException() {
        User otherUser = User.builder().id(2L).build();
        Address otherAddress = Address.builder().id(2L).user(otherUser).fullName("Other").phone("1234567890")
                .street("Other St").city("Delhi").state("Delhi").pincode("110001").build();

        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "Mumbai")).thenReturn(true);
        when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

        assertThatThrownBy(() -> addressService.updateAddress(1L, 2L, addressRequest))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateAddress_setDefault_shouldClearOtherDefaults() {
        Address existingDefault = Address.builder().id(2L).user(user).fullName("Other")
                .phone("9876543210").street("Other St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(true).build();

        AddressRequest defaultRequest = AddressRequest.builder().fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(true).build();

        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "Mumbai")).thenReturn(true);
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        // Simulate updateEntity actually setting isDefault on the address
        doAnswer(inv -> {
            Address a = inv.getArgument(0);
            AddressRequest r = inv.getArgument(1);
            a.setIsDefault(r.getIsDefault());
            return null;
        }).when(addressMapper).updateEntity(address, defaultRequest);
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(address, existingDefault));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));
        when(addressMapper.toResponse(any(Address.class))).thenReturn(addressResponse);

        addressService.updateAddress(1L, 1L, defaultRequest);

        assertThat(existingDefault.getIsDefault()).isFalse();
        verify(addressRepository, atLeast(2)).save(any(Address.class));
    }

    @Test
    void createAddress_setDefault_shouldClearOtherDefaults() {
        Address existingDefault = Address.builder().id(2L).user(user).fullName("Other")
                .phone("9876543210").street("Other St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(true).build();

        AddressRequest defaultRequest = AddressRequest.builder().fullName("New Default").phone("9876543210")
                .street("New St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(true).build();

        Address newAddress = Address.builder().id(null).user(user).fullName("New Default").phone("9876543210")
                .street("New St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(true).build();

        when(addressValidator.isValidState("Maharashtra")).thenReturn(true);
        when(addressValidator.isValidCityForState("Maharashtra", "Mumbai")).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressMapper.toEntity(defaultRequest, user)).thenReturn(newAddress);
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(existingDefault));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));
        when(addressMapper.toResponse(any(Address.class))).thenReturn(addressResponse);

        addressService.createAddress(1L, defaultRequest);

        assertThat(existingDefault.getIsDefault()).isFalse();
    }

    @Test
    void deleteAddress_shouldDelete() {
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));

        addressService.deleteAddress(1L, 1L);

        verify(addressRepository).delete(address);
    }

    @Test
    void deleteAddress_notFound_shouldThrowException() {
        when(addressRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.deleteAddress(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteAddress_wrongUser_shouldThrowException() {
        User otherUser = User.builder().id(2L).build();
        Address otherAddress = Address.builder().id(2L).user(otherUser).build();
        when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

        assertThatThrownBy(() -> addressService.deleteAddress(1L, 2L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void setDefaultAddress_shouldSetDefaultAndClearOthers() {
        Address existingDefault = Address.builder().id(2L).user(user).fullName("Other")
                .phone("9876543210").street("Other St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(true).build();

        AddressResponse defaultResponse = AddressResponse.builder().id(1L).fullName("Test User")
                .phone("9876543210").street("123 Main St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(true).build();

        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(address, existingDefault));
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> inv.getArgument(0));
        when(addressMapper.toResponse(any(Address.class))).thenReturn(defaultResponse);

        AddressResponse result = addressService.setDefaultAddress(1L, 1L);

        assertThat(result.getIsDefault()).isTrue();
        assertThat(existingDefault.getIsDefault()).isFalse();
        assertThat(address.getIsDefault()).isTrue();
        verify(addressRepository, atLeast(2)).save(any(Address.class));
    }

    @Test
    void setDefaultAddress_notFound_shouldThrowException() {
        when(addressRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.setDefaultAddress(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void setDefaultAddress_wrongUser_shouldThrowException() {
        User otherUser = User.builder().id(2L).build();
        Address otherAddress = Address.builder().id(2L).user(otherUser).fullName("Other")
                .phone("1234567890").street("Other St").city("Delhi").state("Delhi")
                .pincode("110001").isDefault(false).build();

        when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

        assertThatThrownBy(() -> addressService.setDefaultAddress(1L, 2L))
                .isInstanceOf(BadRequestException.class);
    }
}
