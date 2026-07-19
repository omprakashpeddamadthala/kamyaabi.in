package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.PackageDimensionSettingRequest;
import com.kamyaabi.dto.response.PackageDimensionSettingResponse;
import com.kamyaabi.entity.PackageDimensionSetting;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.PackageDimensionSettingMapper;
import com.kamyaabi.repository.PackageDimensionSettingRepository;
import com.kamyaabi.service.PackageDimensionSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PackageDimensionSettingServiceImpl implements PackageDimensionSettingService {

    private final PackageDimensionSettingRepository repository;
    private final PackageDimensionSettingMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<PackageDimensionSettingResponse> getAllSettings() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PackageDimensionSettingResponse getSettingById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Package dimension setting not found with id: " + id));
    }

    @Override
    @Transactional
    public PackageDimensionSettingResponse createSetting(PackageDimensionSettingRequest request) {
        if (repository.existsByPackageWeightGram(request.packageWeightGram())) {
            throw new DuplicateResourceException(
                    "Package weight limit slab is already configured: " + request.packageWeightGram() + "g");
        }

        PackageDimensionSetting setting = PackageDimensionSetting.builder()
                .packageWeightGram(request.packageWeightGram())
                .length(request.length())
                .breadth(request.breadth())
                .height(request.height())
                .active(request.active() == null || request.active())
                .build();

        PackageDimensionSetting saved = repository.save(setting);
        log.info("Created new package dimension setting: {}g ({}x{}x{})",
                saved.getPackageWeightGram(), saved.getLength(), saved.getBreadth(), saved.getHeight());
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PackageDimensionSettingResponse updateSetting(Long id, PackageDimensionSettingRequest request) {
        PackageDimensionSetting existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package dimension setting not found with id: " + id));

        if (repository.existsByPackageWeightGramAndIdNot(request.packageWeightGram(), id)) {
            throw new DuplicateResourceException(
                    "Package weight limit slab is already configured: " + request.packageWeightGram() + "g");
        }

        existing.setPackageWeightGram(request.packageWeightGram());
        existing.setLength(request.length());
        existing.setBreadth(request.breadth());
        existing.setHeight(request.height());
        if (request.active() != null) {
            existing.setActive(request.active());
        }

        PackageDimensionSetting saved = repository.save(existing);
        log.info("Updated package dimension setting id {}: {}g ({}x{}x{})",
                saved.getId(), saved.getPackageWeightGram(), saved.getLength(), saved.getBreadth(), saved.getHeight());
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteSetting(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Package dimension setting not found with id: " + id);
        }
        repository.deleteById(id);
        log.info("Deleted package dimension setting id {}", id);
    }

    @Override
    @Transactional
    public PackageDimensionSettingResponse updateStatus(Long id, Boolean active) {
        PackageDimensionSetting existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package dimension setting not found with id: " + id));

        existing.setActive(active);
        PackageDimensionSetting saved = repository.save(existing);
        log.info("Updated status of package dimension setting id {} to active={}", id, active);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PackageDimensionSetting findBestPackageForWeight(double weightKg) {
        double weightGrams = weightKg * 1000.0;
        List<PackageDimensionSetting> activeSettings = repository.findByActiveTrueOrderByPackageWeightGramAsc();

        if (activeSettings.isEmpty()) {
            log.warn("No active package dimension settings found in database. Using properties fallbacks.");
            return null;
        }

        // Find the first slab that is large enough to contain the order's weight
        for (PackageDimensionSetting setting : activeSettings) {
            if (setting.getPackageWeightGram() >= weightGrams) {
                log.debug("Selected package slab: {}g for weight {}g", setting.getPackageWeightGram(), weightGrams);
                return setting;
            }
        }

        // If the weight exceeds all configured active slabs, return the largest configured slab
        PackageDimensionSetting largestSlab = activeSettings.get(activeSettings.size() - 1);
        log.warn("Order weight {}g exceeds all configured slabs. Falling back to the largest slab: {}g",
                weightGrams, largestSlab.getPackageWeightGram());
        return largestSlab;
    }
}
