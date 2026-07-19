package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.PackageDimensionSettingRequest;
import com.kamyaabi.dto.response.PackageDimensionSettingResponse;
import com.kamyaabi.entity.PackageDimensionSetting;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.PackageDimensionSettingMapper;
import com.kamyaabi.repository.PackageDimensionSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PackageDimensionSettingServiceImplTest {

    @Mock
    private PackageDimensionSettingRepository repository;

    @Mock
    private PackageDimensionSettingMapper mapper;

    @InjectMocks
    private PackageDimensionSettingServiceImpl service;

    private PackageDimensionSetting setting100;
    private PackageDimensionSetting setting250;
    private PackageDimensionSettingResponse response100;

    @BeforeEach
    void setUp() {
        setting100 = PackageDimensionSetting.builder()
                .id(1L)
                .packageWeightGram(100)
                .length(10)
                .breadth(10)
                .height(10)
                .active(true)
                .build();

        setting250 = PackageDimensionSetting.builder()
                .id(2L)
                .packageWeightGram(250)
                .length(12)
                .breadth(12)
                .height(12)
                .active(true)
                .build();

        response100 = PackageDimensionSettingResponse.builder()
                .id(1L)
                .packageWeightGram(100)
                .length(10)
                .breadth(10)
                .height(10)
                .active(true)
                .build();
    }

    @Test
    void getAllSettings_returnsList() {
        when(repository.findAll()).thenReturn(List.of(setting100));
        when(mapper.toResponse(setting100)).thenReturn(response100);

        List<PackageDimensionSettingResponse> result = service.getAllSettings();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).packageWeightGram()).isEqualTo(100);
        verify(repository).findAll();
    }

    @Test
    void getSettingById_whenFound_returnsResponse() {
        when(repository.findById(1L)).thenReturn(Optional.of(setting100));
        when(mapper.toResponse(setting100)).thenReturn(response100);

        PackageDimensionSettingResponse result = service.getSettingById(1L);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
    }

    @Test
    void getSettingById_whenNotFound_throwsException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getSettingById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void createSetting_whenDuplicate_throwsException() {
        PackageDimensionSettingRequest request = PackageDimensionSettingRequest.builder()
                .packageWeightGram(100)
                .length(10)
                .breadth(10)
                .height(10)
                .active(true)
                .build();

        when(repository.existsByPackageWeightGram(100)).thenReturn(true);

        assertThatThrownBy(() -> service.createSetting(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("100g");
        verify(repository, never()).save(any());
    }

    @Test
    void createSetting_success_savesAndReturns() {
        PackageDimensionSettingRequest request = PackageDimensionSettingRequest.builder()
                .packageWeightGram(100)
                .length(10)
                .breadth(10)
                .height(10)
                .active(true)
                .build();

        when(repository.existsByPackageWeightGram(100)).thenReturn(false);
        when(repository.save(any(PackageDimensionSetting.class))).thenReturn(setting100);
        when(mapper.toResponse(setting100)).thenReturn(response100);

        PackageDimensionSettingResponse result = service.createSetting(request);

        assertThat(result).isNotNull();
        assertThat(result.packageWeightGram()).isEqualTo(100);
        verify(repository).save(any(PackageDimensionSetting.class));
    }

    @Test
    void updateSetting_whenDuplicate_throwsException() {
        PackageDimensionSettingRequest request = PackageDimensionSettingRequest.builder()
                .packageWeightGram(250)
                .length(12)
                .breadth(12)
                .height(12)
                .active(true)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(setting100));
        when(repository.existsByPackageWeightGramAndIdNot(250, 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.updateSetting(1L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("250g");
        verify(repository, never()).save(any());
    }

    @Test
    void updateSetting_success_updatesAndSaves() {
        PackageDimensionSettingRequest request = PackageDimensionSettingRequest.builder()
                .packageWeightGram(250)
                .length(12)
                .breadth(12)
                .height(12)
                .active(true)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(setting100));
        when(repository.existsByPackageWeightGramAndIdNot(250, 1L)).thenReturn(false);
        when(repository.save(setting100)).thenReturn(setting100);
        when(mapper.toResponse(setting100)).thenReturn(response100);

        service.updateSetting(1L, request);

        assertThat(setting100.getPackageWeightGram()).isEqualTo(250);
        assertThat(setting100.getLength()).isEqualTo(12);
        verify(repository).save(setting100);
    }

    @Test
    void deleteSetting_whenNotFound_throwsException() {
        when(repository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteSetting(99L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }

    @Test
    void deleteSetting_success() {
        when(repository.existsById(1L)).thenReturn(true);

        service.deleteSetting(1L);

        verify(repository).deleteById(1L);
    }

    @Test
    void updateStatus_success() {
        when(repository.findById(1L)).thenReturn(Optional.of(setting100));
        when(repository.save(setting100)).thenReturn(setting100);

        service.updateStatus(1L, false);

        assertThat(setting100.getActive()).isFalse();
        verify(repository).save(setting100);
    }

    @Test
    void findBestPackageForWeight_whenNoActiveSettings_returnsNull() {
        when(repository.findByActiveTrueOrderByPackageWeightGramAsc()).thenReturn(Collections.emptyList());

        PackageDimensionSetting result = service.findBestPackageForWeight(0.20);

        assertThat(result).isNull();
    }

    @Test
    void findBestPackageForWeight_whenExactMatch_returnsSetting() {
        when(repository.findByActiveTrueOrderByPackageWeightGramAsc()).thenReturn(List.of(setting100, setting250));

        // 0.10 kg = 100 grams
        PackageDimensionSetting result = service.findBestPackageForWeight(0.10);

        assertThat(result).isNotNull();
        assertThat(result.getPackageWeightGram()).isEqualTo(100);
    }

    @Test
    void findBestPackageForWeight_whenIntermediateWeight_returnsNextSlab() {
        when(repository.findByActiveTrueOrderByPackageWeightGramAsc()).thenReturn(List.of(setting100, setting250));

        // 0.15 kg = 150 grams -> should map to 250g slab
        PackageDimensionSetting result = service.findBestPackageForWeight(0.15);

        assertThat(result).isNotNull();
        assertThat(result.getPackageWeightGram()).isEqualTo(250);
    }

    @Test
    void findBestPackageForWeight_whenExceedsAll_returnsLargestSlab() {
        when(repository.findByActiveTrueOrderByPackageWeightGramAsc()).thenReturn(List.of(setting100, setting250));

        // 0.40 kg = 400 grams -> exceeds all (100g, 250g) -> should fallback to largest active (250g)
        PackageDimensionSetting result = service.findBestPackageForWeight(0.40);

        assertThat(result).isNotNull();
        assertThat(result.getPackageWeightGram()).isEqualTo(250);
    }
}
