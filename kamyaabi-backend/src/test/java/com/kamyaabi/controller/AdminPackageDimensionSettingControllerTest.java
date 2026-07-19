package com.kamyaabi.controller;

import com.kamyaabi.dto.request.PackageDimensionSettingRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.PackageDimensionSettingResponse;
import com.kamyaabi.service.PackageDimensionSettingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminPackageDimensionSettingControllerTest {

    @Mock
    private PackageDimensionSettingService service;

    @InjectMocks
    private AdminPackageDimensionSettingController controller;

    private PackageDimensionSettingResponse response100;

    @BeforeEach
    void setUp() {
        response100 = PackageDimensionSettingResponse.builder()
                .id(1L)
                .packageWeightGram(100)
                .length(10)
                .breadth(10)
                .height(10)
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getAllSettings_returnsSuccess() {
        when(service.getAllSettings()).thenReturn(List.of(response100));

        ResponseEntity<ApiResponse<List<PackageDimensionSettingResponse>>> result = controller.getAllSettings();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data()).hasSize(1);
        verify(service).getAllSettings();
    }

    @Test
    void getSetting_returnsSuccess() {
        when(service.getSettingById(1L)).thenReturn(response100);

        ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> result = controller.getSetting(1L);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data().id()).isEqualTo(1L);
        verify(service).getSettingById(1L);
    }

    @Test
    void createSetting_returnsCreated() {
        PackageDimensionSettingRequest request = PackageDimensionSettingRequest.builder()
                .packageWeightGram(100)
                .length(10)
                .breadth(10)
                .height(10)
                .active(true)
                .build();
        when(service.createSetting(request)).thenReturn(response100);

        ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> result = controller.createSetting(request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data().packageWeightGram()).isEqualTo(100);
        verify(service).createSetting(request);
    }

    @Test
    void updateSetting_returnsSuccess() {
        PackageDimensionSettingRequest request = PackageDimensionSettingRequest.builder()
                .packageWeightGram(100)
                .length(10)
                .breadth(10)
                .height(10)
                .active(true)
                .build();
        when(service.updateSetting(1L, request)).thenReturn(response100);

        ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> result = controller.updateSetting(1L, request);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().data().packageWeightGram()).isEqualTo(100);
        verify(service).updateSetting(1L, request);
    }

    @Test
    void deleteSetting_returnsSuccess() {
        ResponseEntity<ApiResponse<Void>> result = controller.deleteSetting(1L);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(service).deleteSetting(1L);
    }

    @Test
    void updateStatus_returnsSuccess() {
        when(service.updateStatus(1L, false)).thenReturn(response100);

        ResponseEntity<ApiResponse<PackageDimensionSettingResponse>> result = controller.updateStatus(1L, Map.of("active", false));

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(service).updateStatus(1L, false);
    }
}
