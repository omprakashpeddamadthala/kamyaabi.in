package com.kamyaabi.service.impl.whatsapp;

import com.kamyaabi.config.AppProperties;
import com.kamyaabi.service.SettingsService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ChatMitraServiceImplTest {

    @Test
    void sendOtp_shouldPostApprovedTemplatePayload() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        AppProperties props = new AppProperties();
        props.getWhatsappOtp().setApiUrl("https://api.chatmitra.com/v2/client");
        props.getWhatsappOtp().setApiToken("cm-test-token");
        props.getWhatsappOtp().setTemplateName("otp_login");
        props.getWhatsappOtp().setLanguage("en");

        SettingsService settingsService = mock(SettingsService.class);
        when(settingsService.getString(SettingsService.CHATMITRA_API_TOKEN, "cm-test-token"))
                .thenReturn("cm-test-token");
        when(settingsService.getString(SettingsService.CHATMITRA_API_BASE_URL, "https://api.chatmitra.com/v2/client"))
                .thenReturn("https://api.chatmitra.com/v2/client");
        when(settingsService.getString(SettingsService.CHATMITRA_OTP_TEMPLATE_ID, "otp_login"))
                .thenReturn("otp_login");
        when(settingsService.getString(SettingsService.CHATMITRA_SENDER_ID, ""))
                .thenReturn("");

        ChatMitraServiceImpl service = new ChatMitraServiceImpl(restTemplate, props, settingsService);

        server.expect(requestTo("https://api.chatmitra.com/v2/client/send_template"))
                .andExpect(method(POST))
                .andExpect(header("Authorization", "Bearer cm-test-token"))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {
                          "templateName": "otp_login",
                          "language": "en",
                          "phoneNumber": "919876543210",
                          "components": [
                            {
                              "type": "body",
                              "parameters": [
                                {"type": "text", "text": "123456"}
                              ]
                            }
                          ]
                        }
                        """))
                .andRespond(withSuccess("{\"status\":\"queued\"}", MediaType.APPLICATION_JSON));

        service.sendOtp("919876543210", "123456");

        server.verify();
    }
}
