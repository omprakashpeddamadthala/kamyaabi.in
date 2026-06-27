package com.kamyaabi.dto.response;

import com.kamyaabi.service.SettingDataType;
import lombok.Builder;

/**
 * Metadata + current value for a single platform setting. Lets the admin UI
 * render every setting dynamically (control type, label, grouping, validation)
 * without hardcoding individual settings on the frontend.
 */
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
