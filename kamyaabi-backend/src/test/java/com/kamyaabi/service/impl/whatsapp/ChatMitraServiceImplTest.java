package com.kamyaabi.service.impl.whatsapp;

import com.kamyaabi.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.POST;

class ChatMitraServiceImplTest {

    @Test
    void sendOtp_shouldPostApprovedTemplatePayload() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        AppProperties props = new AppProperties();
        props.getWhatsappOtp().setApiUrl("https://backend.chatmitra.com/developer/api");
        props.getWhatsappOtp().setApiToken("cm-test-token");
        props.getWhatsappOtp().setTemplateName("otp_login");
        props.getWhatsappOtp().setLanguage("en");

        ChatMitraServiceImpl service = new ChatMitraServiceImpl(restTemplate, props);

        server.expect(requestTo("https://backend.chatmitra.com/developer/api/send_template"))
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
