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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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

    @InjectMocks private AddressServiceImpl addressService;

    private User user;
    private Address address;
    private AddressResponse addressResponse;
    private AddressRequest addressRequest;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("test@kamyaabi.in").name("Test").role(User.Role.USER).build();
        address = Address.builder().id(1L).user(user).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("MH").pincode("400001").isDefault(false).build();
        addressResponse = AddressResponse.builder().id(1L).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("MH").pincode("400001").isDefault(false).build();
        addressRequest = AddressRequest.builder().fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("MH").pincode("400001").build();
    }

    @Test
    void getUserAddresses_shouldReturnList() {
        when(addressRepository.findByUserId(1L)).thenReturn(List.of(address));
        when(addressMapper.toResponse(address)).thenReturn(addressResponse);

        List<AddressResponse> result = addressService.getUserAddresses(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFullName()).isEqualTo("Test User");
    }

    @Test
    void createAddress_shouldReturnCreatedAddress() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(addressMapper.toEntity(addressRequest, user)).thenReturn(address);
        when(addressRepository.save(address)).thenReturn(address);
        when(addressMapper.toResponse(address)).thenReturn(addressResponse);

        AddressResponse result = addressService.createAddress(1L, addressRequest);

        assertThat(result.getFullName()).isEqualTo("Test User");
        verify(addressRepository).save(address);
    }

    @Test
    void createAddress_userNotFound_shouldThrowException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.createAddress(999L, addressRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateAddress_shouldReturnUpdatedAddress() {
        when(addressRepository.findById(1L)).thenReturn(Optional.of(address));
        when(addressRepository.save(any(Address.class))).thenReturn(address);
        when(addressMapper.toResponse(any(Address.class))).thenReturn(addressResponse);

        AddressResponse result = addressService.updateAddress(1L, 1L, addressRequest);

        assertThat(result.getFullName()).isEqualTo("Test User");
        verify(addressMapper).updateEntity(address, addressRequest);
    }

    @Test
    void updateAddress_notFound_shouldThrowException() {
        when(addressRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.updateAddress(1L, 999L, addressRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateAddress_wrongUser_shouldThrowException() {
        User otherUser = User.builder().id(2L).build();
        Address otherAddress = Address.builder().id(2L).user(otherUser).build();
        when(addressRepository.findById(2L)).thenReturn(Optional.of(otherAddress));

        assertThatThrownBy(() -> addressService.updateAddress(1L, 2L, addressRequest))
                .isInstanceOf(BadRequestException.class);
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
}
