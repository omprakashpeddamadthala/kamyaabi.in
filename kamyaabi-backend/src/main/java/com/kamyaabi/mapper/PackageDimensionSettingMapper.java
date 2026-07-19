package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.PackageDimensionSettingResponse;
import com.kamyaabi.entity.PackageDimensionSetting;
import org.springframework.stereotype.Component;

@Component
public class PackageDimensionSettingMapper {

    public PackageDimensionSettingResponse toResponse(PackageDimensionSetting setting) {
        if (setting == null) {
            return null;
        }
        return PackageDimensionSettingResponse.builder()
                .id(setting.getId())
                .packageWeightGram(setting.getPackageWeightGram())
                .length(setting.getLength())
                .breadth(setting.getBreadth())
                .height(setting.getHeight())
                .active(setting.getActive())
                .createdAt(setting.getCreatedAt())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
