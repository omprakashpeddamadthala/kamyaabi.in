package com.kamyaabi.service.impl;

import com.kamyaabi.config.ShiprocketProperties;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.service.PackageDimensionSettingService;
import com.kamyaabi.service.shiprocket.ShiprocketApiClient;
import com.kamyaabi.service.shiprocket.ShiprocketAuthClient;
import com.kamyaabi.service.shiprocket.ShiprocketStatusMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Integration tests that hit the real Shiprocket API.
 * <p>
 * Run with:
 * <pre>
 * SHIPROCKET_EMAIL=... SHIPROCKET_PASSWORD=... mvn test \
 *   -Dtest=ShiprocketIntegrationTest -Dgroups=integration
 * </pre>
 * <p>
 * These tests are <b>read-only</b> (auth + channel listing) —
 * they do NOT create orders, assign AWBs, or schedule pickups.
 */
@Tag("integration")
@EnabledIfEnvironmentVariable(named = "SHIPROCKET_EMAIL", matches = ".+")
class ShiprocketIntegrationTest {

    private static final String BASE_URL = "https://apiv2.shiprocket.in/v1/external";

    private ShiprocketProperties properties;
    private ShiprocketAuthClient authClient;
    private ShiprocketServiceImpl shiprocketService;
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        properties = new ShiprocketProperties();
        properties.setEmail(System.getenv("SHIPROCKET_EMAIL"));
        properties.setPassword(System.getenv("SHIPROCKET_PASSWORD"));
        properties.setApiToken("");

        restTemplate = new RestTemplate();
        authClient = new HttpEntity<>(null) != null ? new ShiprocketAuthClient(properties, restTemplate) : null;
        ShiprocketApiClient apiClient = new ShiprocketApiClient(
                properties, restTemplate, authClient, mock(PackageDimensionSettingService.class));
        shiprocketService = new ShiprocketServiceImpl(
                properties, mock(OrderRepository.class), apiClient, new ShiprocketStatusMapper());
    }

    @Test
    void isConfigured_withRealCredentials_returnsTrue() {
        assertThat(shiprocketService.isConfigured()).isTrue();
    }

    @Test
    void getToken_withRealCredentials_returnsNonBlankToken() {
        String token = authClient.getToken();
        assertThat(token).isNotNull().isNotBlank();
        System.out.println("Shiprocket auth token obtained (length=" + token.length() + ")");
    }

    @Test
    void getToken_secondCallHitsCache() {
        String first = authClient.getToken();
        String second = authClient.getToken();
        assertThat(first).isEqualTo(second);
    }

    @Test
    @SuppressWarnings("unchecked")
    void listChannels_withRealToken_returnsData() {
        String token = authClient.getToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        ResponseEntity<Map> response = restTemplate.exchange(
                BASE_URL + "/channels",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        System.out.println("Shiprocket channels response: " + response.getBody());
    }

    @Test
    @SuppressWarnings("unchecked")
    void listPickupLocations_withRealToken_returnsData() {
        String token = authClient.getToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        ResponseEntity<Map> response = restTemplate.exchange(
                BASE_URL + "/settings/company/pickup",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        System.out.println("Shiprocket pickup locations: " + response.getBody());
    }
}
