package com.kamyaabi.mapper;

import com.kamyaabi.dto.request.AddressRequest;
import com.kamyaabi.dto.response.AddressResponse;
import com.kamyaabi.entity.Address;
import com.kamyaabi.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AddressMapperTest {

    private final AddressMapper addressMapper = new AddressMapper();

    @Test
    void toResponse_shouldMapAllFields() {
        Address address = Address.builder()
                .id(1L).fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4").city("Mumbai")
                .state("Maharashtra").pincode("400001").isDefault(true)
                .build();

        AddressResponse response = addressMapper.toResponse(address);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getFullName()).isEqualTo("Test User");
        assertThat(response.getPhone()).isEqualTo("9876543210");
        assertThat(response.getStreet()).isEqualTo("123 Main St");
        assertThat(response.getAddressLine2()).isEqualTo("Apt 4");
        assertThat(response.getCity()).isEqualTo("Mumbai");
        assertThat(response.getState()).isEqualTo("Maharashtra");
        assertThat(response.getPincode()).isEqualTo("400001");
        assertThat(response.getIsDefault()).isTrue();
    }

    @Test
    void toResponse_nullAddressLine2_shouldReturnNull() {
        Address address = Address.builder()
                .id(1L).fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("Maharashtra")
                .pincode("400001").isDefault(false)
                .build();

        AddressResponse response = addressMapper.toResponse(address);

        assertThat(response.getAddressLine2()).isNull();
    }

    @Test
    void toEntity_shouldMapAllFields() {
        User user = User.builder().id(1L).email("test@kamyaabi.in").build();
        AddressRequest request = AddressRequest.builder()
                .fullName("Test User").phone("9876543210")
                .street("123 Main St").addressLine2("Apt 4").city("Mumbai")
                .state("Maharashtra").pincode("400001").isDefault(true)
                .build();

        Address address = addressMapper.toEntity(request, user);

        assertThat(address.getFullName()).isEqualTo("Test User");
        assertThat(address.getAddressLine2()).isEqualTo("Apt 4");
        assertThat(address.getUser()).isEqualTo(user);
        assertThat(address.getIsDefault()).isTrue();
    }

    @Test
    void toEntity_nullIsDefault_shouldDefaultToFalse() {
        User user = User.builder().id(1L).build();
        AddressRequest request = AddressRequest.builder()
                .fullName("Test User").phone("9876543210")
                .street("123 Main St").city("Mumbai").state("Maharashtra")
                .pincode("400001")
                .build();

        Address address = addressMapper.toEntity(request, user);

        assertThat(address.getIsDefault()).isFalse();
    }

    @Test
    void updateEntity_shouldUpdateAllFields() {
        Address address = Address.builder()
                .id(1L).fullName("Old Name").phone("111").street("Old St")
                .addressLine2("Old Line2").city("Old City").state("Old")
                .pincode("000000").isDefault(false)
                .build();
        AddressRequest request = AddressRequest.builder()
                .fullName("New Name").phone("222").street("New St")
                .addressLine2("New Line2").city("New City").state("New")
                .pincode("111111").isDefault(true)
                .build();

        addressMapper.updateEntity(address, request);

        assertThat(address.getFullName()).isEqualTo("New Name");
        assertThat(address.getPhone()).isEqualTo("222");
        assertThat(address.getAddressLine2()).isEqualTo("New Line2");
        assertThat(address.getCity()).isEqualTo("New City");
        assertThat(address.getIsDefault()).isTrue();
    }

    @Test
    void updateEntity_nullIsDefault_shouldNotChangeDefault() {
        Address address = Address.builder()
                .id(1L).fullName("Old").isDefault(true)
                .build();
        AddressRequest request = AddressRequest.builder()
                .fullName("New").phone("222").street("St")
                .city("City").state("State").pincode("123456")
                .build();

        addressMapper.updateEntity(address, request);

        assertThat(address.getIsDefault()).isTrue();
    }
}
