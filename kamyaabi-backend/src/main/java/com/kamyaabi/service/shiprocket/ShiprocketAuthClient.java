package com.kamyaabi.service.shiprocket;

import com.kamyaabi.config.ShiprocketProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

@Slf4j
@Component
public class ShiprocketAuthClient {

    private final ShiprocketProperties properties;
    private final RestTemplate restTemplate;

    private final Object tokenLock = new Object();
    private volatile String cachedToken;
    private volatile Instant cachedTokenExpiresAt;

    public ShiprocketAuthClient(ShiprocketProperties properties, RestTemplate restTemplate) {
        this.properties = properties;
        this.restTemplate = restTemplate;
    }

    public String getToken() {
        if (!properties.hasLoginCredentials()) {
            return properties.getApiToken();
        }
        if (isCachedTokenValid()) {
            return cachedToken;
        }
        synchronized (tokenLock) {
            if (isCachedTokenValid()) {
                return cachedToken;
            }
            return refreshToken();
        }
    }

    public HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(getToken());
        return headers;
    }

    public <T> T executeWithAuthRetry(Supplier<T> apiCall) {
        try {
            return apiCall.get();
        } catch (HttpClientErrorException.Unauthorized e) {
            if (!properties.hasLoginCredentials()) {
                throw e;
            }
            log.warn("Shiprocket call returned 401 — forcing token refresh and retrying once");
            synchronized (tokenLock) {
                cachedToken = null;
                cachedTokenExpiresAt = null;
                refreshToken();
            }
            return apiCall.get();
        }
    }

    private boolean isCachedTokenValid() {
        return cachedToken != null
                && cachedTokenExpiresAt != null
                && Instant.now().isBefore(cachedTokenExpiresAt);
    }

    private String refreshToken() {
        if (!properties.hasLoginCredentials()) {
            return properties.getApiToken();
        }

        log.info("Refreshing Shiprocket auth token via /auth/login");

        Map<String, String> body = new HashMap<>();
        body.put("email", ShiprocketProperties.sanitize(properties.getEmail()));
        body.put("password", ShiprocketProperties.sanitize(properties.getPassword()));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                ShiprocketEndpoints.AUTH_LOGIN, request,
                (Class<Map<String, Object>>) (Class<?>) Map.class);

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || responseBody.get("token") == null) {
            throw new IllegalStateException("Shiprocket /auth/login returned no token");
        }

        String token = String.valueOf(responseBody.get("token"));
        cachedToken = token;
        cachedTokenExpiresAt = Instant.now().plusSeconds(properties.getTokenRefreshIntervalSeconds());
        log.info("Shiprocket auth token refreshed; next refresh after {}", cachedTokenExpiresAt);
        return token;
    }
}
