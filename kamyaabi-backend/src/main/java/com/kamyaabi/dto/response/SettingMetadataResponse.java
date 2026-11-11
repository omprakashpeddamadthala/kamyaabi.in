package com.kamyaabi.dto.response;

import com.kamyaabi.service.SettingDataType;
import lombok.Builder;

@Builder
public record SettingMetadataResponse(
        String key,
        String label,
        String value,
        String description,
        String helperText,
        String category,
        SettingDataType dataType,
        boolean editable,
        String defaultValue,
        Integer min,
        Integer max,
        boolean required
) {
}
