package com.kamyaabi.controller;

import com.kamyaabi.dto.request.AddressRequest;
import com.kamyaabi.dto.response.AddressResponse;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.AddressService;
import com.kamyaabi.validation.IndianAddressValidator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/addresses")
@Tag(name = "Addresses", description = "User address management endpoints")
public class AddressController {

    private final AddressService addressService;
    private final CurrentUser currentUser;
    private final IndianAddressValidator addressValidator;

    public AddressController(AddressService addressService, CurrentUser currentUser,
                             IndianAddressValidator addressValidator) {
        this.addressService = addressService;
        this.currentUser = currentUser;
        this.addressValidator = addressValidator;
    }

    @GetMapping
    @Operation(summary = "Get user addresses", description = "Get all addresses for current user")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getUserAddresses() {
        List<AddressResponse> addresses = addressService.getUserAddresses(currentUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @PostMapping
    @Operation(summary = "Create address", description = "Add a new shipping address")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @Valid @RequestBody AddressRequest request) {
        AddressResponse address = addressService.createAddress(currentUser.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Address created", address));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update address")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request) {
        AddressResponse address = addressService.updateAddress(currentUser.getUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated", address));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(currentUser.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted", null));
    }

    @GetMapping("/states")
    @Operation(summary = "Get Indian states", description = "Get list of all Indian states and union territories")
    public ResponseEntity<ApiResponse<List<String>>> getStates() {
        return ResponseEntity.ok(ApiResponse.success(addressValidator.getStates()));
    }

    @GetMapping("/states/{state}/cities")
    @Operation(summary = "Get cities for state", description = "Get list of cities for a given Indian state")
    public ResponseEntity<ApiResponse<List<String>>> getCities(@PathVariable String state) {
        List<String> cities = addressValidator.getCitiesForState(state);
        return ResponseEntity.ok(ApiResponse.success(cities));
    }
}
