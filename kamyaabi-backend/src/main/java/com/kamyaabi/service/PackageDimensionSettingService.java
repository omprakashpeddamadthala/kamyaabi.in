package com.kamyaabi.service;

import com.kamyaabi.dto.request.PackageDimensionSettingRequest;
import com.kamyaabi.dto.response.PackageDimensionSettingResponse;
import com.kamyaabi.entity.PackageDimensionSetting;

import java.util.List;

public interface PackageDimensionSettingService {

    List<PackageDimensionSettingResponse> getAllSettings();

    PackageDimensionSettingResponse getSettingById(Long id);

    PackageDimensionSettingResponse createSetting(PackageDimensionSettingRequest request);

    PackageDimensionSettingResponse updateSetting(Long id, PackageDimensionSettingRequest request);

    void deleteSetting(Long id);

    PackageDimensionSettingResponse updateStatus(Long id, Boolean active);

    PackageDimensionSetting findBestPackageForWeight(double weightKg);
}
