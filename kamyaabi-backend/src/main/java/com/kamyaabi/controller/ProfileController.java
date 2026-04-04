package com.kamyaabi.controller;

import com.kamyaabi.dto.request.ProfileRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.ProfileResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.ProfileService;
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
@RequestMapping("/api/profile")
@Tag(name = "Profile", description = "User profile management endpoints")
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUser currentUser;
    private final IndianAddressValidator addressValidator;

    public ProfileController(ProfileService profileService, CurrentUser currentUser,
                             IndianAddressValidator addressValidator) {
        this.profileService = profileService;
        this.currentUser = currentUser;
        this.addressValidator = addressValidator;
    }

    @GetMapping
    @Operation(summary = "Get user profile", description = "Get the currently authenticated user's profile details")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile() {
        Long userId = currentUser.getUserId();
        ProfileResponse response = profileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping
    @Operation(summary = "Update user profile", description = "Update the currently authenticated user's profile details")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @Valid @RequestBody ProfileRequest request) {
        Long userId = currentUser.getUserId();
        ProfileResponse response = profileService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
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
