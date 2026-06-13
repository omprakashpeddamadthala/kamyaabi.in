package com.kamyaabi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class JsonFieldConverter {

    private final ObjectMapper objectMapper;

    public JsonFieldConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public <T> T read(String json, TypeReference<T> type) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception e) {
            log.warn("Failed to parse JSON field, returning null: {}", e.getMessage());
            return null;
        }
    }

    public String write(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Map<?, ?> m && m.isEmpty()) {
            return null;
        }
        if (value instanceof List<?> l && l.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("Failed to serialize JSON field, storing null: {}", e.getMessage());
            return null;
        }
    }
}
