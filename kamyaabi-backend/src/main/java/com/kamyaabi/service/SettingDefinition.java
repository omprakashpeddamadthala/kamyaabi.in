package com.kamyaabi.service;

import lombok.Builder;

/**
 * Static metadata describing a single platform setting: how it should be
 * labelled, grouped and edited in the admin UI, plus its default value and
 * validation rules. The runtime value is resolved separately and combined with
 * this definition to produce the response served to the admin settings page.
 */
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
