package com.kamyaabi.service.impl.whatsapp;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kamyaabi.config.AppProperties;
import com.kamyaabi.exception.BusinessException;
import com.kamyaabi.service.SettingsService;
import com.kamyaabi.service.whatsapp.ChatMitraService;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Service
public class ChatMitraServiceImpl implements ChatMitraService {

    private final RestTemplate restTemplate;
    private final AppProperties appProperties;
    private final SettingsService settingsService;

    public ChatMitraServiceImpl(
            RestTemplate restTemplate,
            AppProperties appProperties,
            SettingsService settingsService) {
        this.restTemplate = restTemplate;
        this.appProperties = appProperties;
        this.settingsService = settingsService;
    }

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        AppProperties.WhatsAppOtp props = appProperties.getWhatsappOtp();
        String apiToken = settingsService.getString(
                SettingsService.CHATMITRA_API_TOKEN,
                props.getApiToken());
        String baseUrl = settingsService.getString(
                SettingsService.CHATMITRA_API_BASE_URL,
                props.getApiUrl());
        String templateName = settingsService.getString(
                SettingsService.CHATMITRA_OTP_TEMPLATE_ID,
                props.getTemplateName());
        String templateLanguage = settingsService.getString(
                SettingsService.CHATMITRA_OTP_LANGUAGE,
                props.getLanguage());
        String senderId = settingsService.getString(SettingsService.CHATMITRA_SENDER_ID, "");
        if (apiToken == null || apiToken.isBlank()) {
            throw new BusinessException("ChatMitra API token is not configured");
        }
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new BusinessException("ChatMitra API base URL is not configured");
        }
        if (templateName == null || templateName.isBlank()) {
            throw new BusinessException("ChatMitra OTP template is not configured");
        }

        String finalBaseUrl = baseUrl.replaceAll("/+$", "");
        boolean useDeveloperApi = false;

        if (finalBaseUrl.contains("backend.chatmitra.com/v2/client")) {
            finalBaseUrl = "https://backend.chatmitra.com/developer/api";
            useDeveloperApi = true;
        } else if (finalBaseUrl.contains("/developer/api")) {
            useDeveloperApi = true;
        }

        Object requestPayload;
        String requestUrl;

        if (useDeveloperApi) {
            requestUrl = finalBaseUrl + "/send_message";
            requestPayload = DeveloperApiSendRequest.builder()
                    .recipientMobileNumber(phoneNumber)
                    .messages(List.of(
                            DeveloperApiMessage.builder()
                                    .kind("template")
                                    .template(DeveloperApiTemplate.builder()
                                            .name(templateName)
                                            .language(templateLanguage)
                                            .components(List.of(
                                                    DeveloperApiComponent.builder()
                                                            .type("body")
                                                            .parameters(List.of(
                                                                    DeveloperApiParameter.builder()
                                                                            .type("text")
                                                                            .text(otp)
                                                                            .build()
                                                            ))
                                                            .build()
                                            ))
                                            .build())
                                    .build()
                    ))
                    .build();
        } else {
            requestUrl = finalBaseUrl + "/send_template";
            requestPayload = TemplateSendRequest.builder()
                    .templateName(templateName)
                    .language(templateLanguage)
                    .senderId(senderId == null || senderId.isBlank() ? null : senderId)
                    .phoneNumber(phoneNumber)
                    .components(List.of(
                            TemplateComponent.builder()
                                    .type("body")
                                    .parameters(List.of(
                                            TemplateParameter.builder()
                                                    .type("text")
                                                    .text(otp)
                                                    .build()
                                    ))
                                    .build()
                    ))
                    .build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiToken);

        try {
            ResponseEntity<ChatMitraResponse> response = restTemplate.postForEntity(
                    requestUrl,
                    new HttpEntity<>(requestPayload, headers),
                    ChatMitraResponse.class);

            ChatMitraResponse body = response.getBody();
            if (body != null && body.status != null && !body.status.isBlank()
                    && !body.status.equalsIgnoreCase("queued")
                    && !body.status.equalsIgnoreCase("success")) {
                throw new BusinessException("ChatMitra rejected the OTP request");
            }
        } catch (RestClientException ex) {
            log.error("ChatMitra OTP send failed for {}", maskPhone(phoneNumber), ex);
            throw new BusinessException("Unable to send WhatsApp OTP right now");
        }
    }

    private String maskPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 6) {
            return "***";
        }
        return phoneNumber.substring(0, 3) + "***" + phoneNumber.substring(phoneNumber.length() - 3);
    }

    @Getter
    @Setter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private static class DeveloperApiSendRequest {
        @JsonProperty("recipient_mobile_number")
        private String recipientMobileNumber;
        private List<DeveloperApiMessage> messages;
    }

    @Getter
    @Setter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private static class DeveloperApiMessage {
        private String kind;
        private DeveloperApiTemplate template;
    }

    @Getter
    @Setter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private static class DeveloperApiTemplate {
        private String name;
        private String language;
        private List<DeveloperApiComponent> components;
    }

    @Getter
    @Setter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private static class DeveloperApiComponent {
        private String type;
        private List<DeveloperApiParameter> parameters;
    }

    @Getter
    @Setter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private static class DeveloperApiParameter {
        private String type;
        private String text;
    }

    @Getter
    @Setter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private static class TemplateSendRequest {
        private String templateName;
        private String language;
        private String senderId;
        private String phoneNumber;
        private List<TemplateComponent> components;
    }

    @Getter
    @Setter
    @Builder
    private static class TemplateComponent {
        private String type;
        private List<TemplateParameter> parameters;
    }

    @Getter
    @Setter
    @Builder
    private static class TemplateParameter {
        private String type;
        private String text;
    }

    @Getter
    @Setter
    private static class ChatMitraResponse {
        private String status;
        private String message;
        private String jobId;
        private String messageId;
    }
}
