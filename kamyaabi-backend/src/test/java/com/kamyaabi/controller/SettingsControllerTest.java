package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.service.SettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettingsControllerTest {

    @Mock private SettingsService settingsService;

    @InjectMocks private SettingsController controller;

    @Test
    void getPublicSettings_returnsServiceResult() {
        when(settingsService.getPublicSettings()).thenReturn(Map.of(
                SettingsService.PRODUCTS_PER_PAGE, "8",
                SettingsService.SHOW_BOUGHT_RECENTLY_BADGE, "true"));

        ResponseEntity<ApiResponse<Map<String, String>>> response = controller.getPublicSettings();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).containsEntry(SettingsService.PRODUCTS_PER_PAGE, "8");
    }
}
