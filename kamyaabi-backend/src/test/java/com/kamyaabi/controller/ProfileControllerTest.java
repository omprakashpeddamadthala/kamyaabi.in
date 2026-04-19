package com.kamyaabi.controller;

import com.kamyaabi.dto.request.ProfileRequest;
import com.kamyaabi.dto.response.ProfileResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    @Mock private ProfileService profileService;
    @Mock private CurrentUser currentUser;

    @InjectMocks private ProfileController profileController;

    @Test
    void getProfile_shouldReturnProfileResponse() {
        ProfileResponse profileResponse = ProfileResponse.builder()
                .id(1L)
                .email("test@kamyaabi.shop")
                .name("Test User")
                .firstName("Test")
                .lastName("User")
                .role("USER")
                .addresses(Collections.emptyList())
                .build();

        when(currentUser.getUserId()).thenReturn(1L);
        when(profileService.getProfile(1L)).thenReturn(profileResponse);

        ResponseEntity<?> response = profileController.getProfile();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void updateProfile_shouldReturnUpdatedProfile() {
        ProfileRequest request = ProfileRequest.builder()
                .firstName("Updated")
                .lastName("Name")
                .build();

        ProfileResponse profileResponse = ProfileResponse.builder()
                .id(1L)
                .email("test@kamyaabi.shop")
                .name("Updated Name")
                .firstName("Updated")
                .lastName("Name")
                .role("USER")
                .addresses(Collections.emptyList())
                .build();

        when(currentUser.getUserId()).thenReturn(1L);
        when(profileService.updateProfile(1L, request)).thenReturn(profileResponse);

        ResponseEntity<?> response = profileController.updateProfile(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
