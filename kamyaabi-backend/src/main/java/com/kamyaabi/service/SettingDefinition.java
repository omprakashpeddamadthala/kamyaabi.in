package com.kamyaabi.service;

import lombok.Builder;

@Builder
public record SettingDefinition(
        String key,
        String label,
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
