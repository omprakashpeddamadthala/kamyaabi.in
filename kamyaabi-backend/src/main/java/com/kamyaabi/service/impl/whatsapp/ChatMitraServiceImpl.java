package com.kamyaabi.service.impl.whatsapp;

import com.kamyaabi.config.AppProperties;
import com.kamyaabi.exception.BusinessException;
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

    public ChatMitraServiceImpl(RestTemplate restTemplate, AppProperties appProperties) {
        this.restTemplate = restTemplate;
        this.appProperties = appProperties;
    }

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        AppProperties.WhatsAppOtp props = appProperties.getWhatsappOtp();
        if (props.getApiToken() == null || props.getApiToken().isBlank()) {
            throw new BusinessException("ChatMitra API token is not configured");
        }
        if (props.getTemplateName() == null || props.getTemplateName().isBlank()) {
            throw new BusinessException("ChatMitra OTP template name is not configured");
        }

        TemplateSendRequest request = TemplateSendRequest.builder()
                .templateName(props.getTemplateName())
                .language(props.getLanguage())
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

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(props.getApiToken());

        try {
            ResponseEntity<ChatMitraResponse> response = restTemplate.postForEntity(
                    props.getApiUrl().replaceAll("/+$", "") + "/send_template",
                    new HttpEntity<>(request, headers),
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
    private static class TemplateSendRequest {
        private String templateName;
        private String language;
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
