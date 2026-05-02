package com.kamyaabi.service.impl;

import com.kamyaabi.entity.Setting;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.repository.SettingRepository;
import com.kamyaabi.service.SettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettingsServiceImplTest {

    @Mock private SettingRepository settingRepository;

    @InjectMocks private SettingsServiceImpl settingsService;

    @Test
    void getInt_returnsValue_whenStored() {
        when(settingRepository.findById(SettingsService.LOW_STOCK_THRESHOLD))
                .thenReturn(Optional.of(setting(SettingsService.LOW_STOCK_THRESHOLD, "25")));
        int n = settingsService.getInt(SettingsService.LOW_STOCK_THRESHOLD, 10);
        assertThat(n).isEqualTo(25);
    }

    @Test
    void getInt_returnsDefault_whenMissing() {
        when(settingRepository.findById("missing")).thenReturn(Optional.empty());
        assertThat(settingsService.getInt("missing", 7)).isEqualTo(7);
    }

    @Test
    void getInt_returnsDefault_whenNonNumeric() {
        when(settingRepository.findById(SettingsService.LOW_STOCK_THRESHOLD))
                .thenReturn(Optional.of(setting(SettingsService.LOW_STOCK_THRESHOLD, "abc")));
        assertThat(settingsService.getInt(SettingsService.LOW_STOCK_THRESHOLD, 10)).isEqualTo(10);
    }

    @Test
    void getBoolean_returnsTrue_whenStoredTrue() {
        when(settingRepository.findById(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE))
                .thenReturn(Optional.of(setting(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, "true")));
        assertThat(settingsService.getBoolean(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, false)).isTrue();
    }

    @Test
    void getBoolean_returnsFalse_whenStoredFalse() {
        when(settingRepository.findById(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE))
                .thenReturn(Optional.of(setting(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, "false")));
        assertThat(settingsService.getBoolean(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, true)).isFalse();
    }

    @Test
    void getBoolean_returnsDefault_whenMissing() {
        when(settingRepository.findById("missing")).thenReturn(Optional.empty());
        assertThat(settingsService.getBoolean("missing", true)).isTrue();
    }

    @Test
    void getBoolean_returnsDefault_whenNonBoolean() {
        when(settingRepository.findById(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE))
                .thenReturn(Optional.of(setting(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, "maybe")));
        assertThat(settingsService.getBoolean(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, true)).isTrue();
    }

    @Test
    void getAll_returnsAllAllowedKeys_withDefaults() {
        when(settingRepository.findById(any())).thenReturn(Optional.empty());
        Map<String, String> all = settingsService.getAll();
        assertThat(all).containsKeys(
                SettingsService.LOW_STOCK_THRESHOLD,
                SettingsService.PRODUCTS_PER_PAGE,
                SettingsService.SHOW_BOUGHT_RECENTLY_BADGE);
    }

    @Test
    void getPublicSettings_excludesLowStockThreshold() {
        when(settingRepository.findById(any())).thenReturn(Optional.empty());
        Map<String, String> publicSettings = settingsService.getPublicSettings();
        assertThat(publicSettings).doesNotContainKey(SettingsService.LOW_STOCK_THRESHOLD);
        assertThat(publicSettings).containsKeys(
                SettingsService.PRODUCTS_PER_PAGE,
                SettingsService.SHOW_BOUGHT_RECENTLY_BADGE);
    }

    @Test
    void updateAll_acceptsValidNumericAndBoolean() {
        when(settingRepository.findById(any())).thenReturn(Optional.empty());
        when(settingRepository.save(any(Setting.class))).thenAnswer(inv -> inv.getArgument(0));
        Map<String, String> updates = new LinkedHashMap<>();
        updates.put(SettingsService.LOW_STOCK_THRESHOLD, "  20 ");
        updates.put(SettingsService.PRODUCTS_PER_PAGE, "16");
        updates.put(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, "TRUE");

        Map<String, String> result = settingsService.updateAll(updates);

        ArgumentCaptor<Setting> captor = ArgumentCaptor.forClass(Setting.class);
        verify(settingRepository, times(3)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(Setting::getKey, Setting::getValue)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple(SettingsService.LOW_STOCK_THRESHOLD, "20"),
                        org.assertj.core.groups.Tuple.tuple(SettingsService.PRODUCTS_PER_PAGE, "16"),
                        org.assertj.core.groups.Tuple.tuple(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, "TRUE"));
        assertThat(result).containsKey(SettingsService.LOW_STOCK_THRESHOLD);
    }

    @Test
    void updateAll_rejectsEmptyMap() {
        assertThatThrownBy(() -> settingsService.updateAll(new LinkedHashMap<>()))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateAll_rejectsNullMap() {
        assertThatThrownBy(() -> settingsService.updateAll(null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateAll_rejectsUnknownKey() {
        Map<String, String> updates = Map.of("bogus", "1");
        assertThatThrownBy(() -> settingsService.updateAll(updates))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unknown setting");
        verify(settingRepository, never()).save(any());
    }

    @Test
    void updateAll_rejectsNullValue() {
        Map<String, String> updates = new LinkedHashMap<>();
        updates.put(SettingsService.LOW_STOCK_THRESHOLD, null);
        assertThatThrownBy(() -> settingsService.updateAll(updates))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateAll_rejectsNonNumericThreshold() {
        Map<String, String> updates = Map.of(SettingsService.LOW_STOCK_THRESHOLD, "abc");
        assertThatThrownBy(() -> settingsService.updateAll(updates))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateAll_rejectsZeroThreshold() {
        Map<String, String> updates = Map.of(SettingsService.LOW_STOCK_THRESHOLD, "0");
        assertThatThrownBy(() -> settingsService.updateAll(updates))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateAll_rejectsNegativeProductsPerPage() {
        Map<String, String> updates = Map.of(SettingsService.PRODUCTS_PER_PAGE, "-3");
        assertThatThrownBy(() -> settingsService.updateAll(updates))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateAll_rejectsNonBooleanBadgeValue() {
        Map<String, String> updates = Map.of(SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, "yes");
        assertThatThrownBy(() -> settingsService.updateAll(updates))
                .isInstanceOf(BadRequestException.class);
    }

    private Setting setting(String key, String value) {
        return Setting.builder().key(key).value(value).build();
    }
}
