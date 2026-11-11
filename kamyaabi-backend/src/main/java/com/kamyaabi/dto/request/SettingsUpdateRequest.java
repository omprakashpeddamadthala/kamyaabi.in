package com.kamyaabi.dto.request;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@NoArgsConstructor
public class SettingsUpdateRequest {

    @NotEmpty(message = "Provide at least one setting to update")
    private final Map<String, String> values = new LinkedHashMap<>();

    @JsonAnySetter
    public void put(String key, String value) {
        values.put(key, value);
    }

    @JsonAnyGetter
    public Map<String, String> any() {
        return values;
    }
}
