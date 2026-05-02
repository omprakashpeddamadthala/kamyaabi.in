package com.kamyaabi.service.impl;

import com.kamyaabi.entity.Setting;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.repository.SettingRepository;
import com.kamyaabi.service.SettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class SettingsServiceImpl implements SettingsService {

    static final Set<String> ALLOWED_KEYS = Set.of(
            LOW_STOCK_THRESHOLD,
            SHOW_BOUGHT_RECENTLY_BADGE,
            PRODUCTS_PER_PAGE);

    static final List<String> PUBLIC_KEYS = List.of(
            SHOW_BOUGHT_RECENTLY_BADGE,
            PRODUCTS_PER_PAGE);

    private final SettingRepository settingRepository;

    public SettingsServiceImpl(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "settings", key = "'int:' + #key")
    public int getInt(String key, int defaultValue) {
        Optional<Setting> row = settingRepository.findById(key);
        if (row.isEmpty()) return defaultValue;
        try {
            return Integer.parseInt(row.get().getValue().trim());
        } catch (NumberFormatException e) {
            log.warn("Setting {} has non-numeric value '{}', falling back to default {}",
                    key, row.get().getValue(), defaultValue);
            return defaultValue;
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "settings", key = "'bool:' + #key")
    public boolean getBoolean(String key, boolean defaultValue) {
        Optional<Setting> row = settingRepository.findById(key);
        if (row.isEmpty()) return defaultValue;
        String raw = row.get().getValue().trim();
        if (raw.equalsIgnoreCase("true")) return true;
        if (raw.equalsIgnoreCase("false")) return false;
        log.warn("Setting {} has non-boolean value '{}', falling back to default {}",
                key, raw, defaultValue);
        return defaultValue;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getAll() {
        Map<String, String> out = new LinkedHashMap<>();
        for (String key : ALLOWED_KEYS) {
            out.put(key, currentValueWithDefault(key));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getPublicSettings() {
        Map<String, String> out = new LinkedHashMap<>();
        for (String key : PUBLIC_KEYS) {
            out.put(key, currentValueWithDefault(key));
        }
        return out;
    }

    @Override
    @Transactional
    @CacheEvict(value = "settings", allEntries = true)
    public Map<String, String> updateAll(Map<String, String> updates) {
        if (updates == null || updates.isEmpty()) {
            throw new BadRequestException("No settings provided");
        }
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (!ALLOWED_KEYS.contains(key)) {
                throw new BadRequestException("Unknown setting key: " + key);
            }
            if (value == null) {
                throw new BadRequestException("Value for setting '" + key + "' cannot be null");
            }
            String trimmed = value.trim();
            validate(key, trimmed);
            Setting row = settingRepository.findById(key)
                    .orElseGet(() -> Setting.builder().key(key).build());
            row.setValue(trimmed);
            settingRepository.save(row);
        }
        return getAll();
    }

    private void validate(String key, String value) {
        switch (key) {
            case LOW_STOCK_THRESHOLD, PRODUCTS_PER_PAGE -> {
                int n;
                try {
                    n = Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    throw new BadRequestException(
                            "Setting '" + key + "' must be a positive integer");
                }
                if (n < 1) {
                    throw new BadRequestException(
                            "Setting '" + key + "' must be >= 1");
                }
            }
            case SHOW_BOUGHT_RECENTLY_BADGE -> {
                if (!"true".equalsIgnoreCase(value) && !"false".equalsIgnoreCase(value)) {
                    throw new BadRequestException(
                            "Setting '" + key + "' must be 'true' or 'false'");
                }
            }
            default -> throw new BadRequestException("Unknown setting key: " + key);
        }
    }

    private String currentValueWithDefault(String key) {
        return switch (key) {
            case LOW_STOCK_THRESHOLD -> String.valueOf(getInt(key, DEFAULT_LOW_STOCK_THRESHOLD));
            case PRODUCTS_PER_PAGE -> String.valueOf(getInt(key, DEFAULT_PRODUCTS_PER_PAGE));
            case SHOW_BOUGHT_RECENTLY_BADGE ->
                    String.valueOf(getBoolean(key, DEFAULT_SHOW_BOUGHT_RECENTLY_BADGE));
            default -> "";
        };
    }
}
