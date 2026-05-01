package com.kamyaabi.email;

import com.kamyaabi.config.EmailProperties;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SendGridEmailServiceTest {

    @Mock
    private SendGrid sendGrid;

    private EmailProperties emailProperties;
    private SendGridEmailService sendGridEmailService;

    @BeforeEach
    void setUp() {
        emailProperties = new EmailProperties();
        emailProperties.setFromEmail("noreply@kamyaabi.in");
        emailProperties.setFromName("Kamyaabi");
        emailProperties.getSendgrid().setApiKey("SG.test-key");

        sendGridEmailService = new SendGridEmailService(sendGrid, emailProperties);
    }

    @Test
    void sendEmail_shouldCallSendGridApi() throws IOException {
        Response response = new Response();
        response.setStatusCode(202);
        response.setBody("");
        when(sendGrid.api(any(Request.class))).thenReturn(response);

        sendGridEmailService.sendEmail("user@test.com", "Test Subject", "<p>Hello</p>");

        verify(sendGrid).api(any(Request.class));
    }

    @Test
    void sendEmail_failedResponse_shouldLogError() throws IOException {
        Response response = new Response();
        response.setStatusCode(400);
        response.setBody("Bad Request");
        when(sendGrid.api(any(Request.class))).thenReturn(response);

        sendGridEmailService.sendEmail("user@test.com", "Test Subject", "<p>Hello</p>");

        verify(sendGrid).api(any(Request.class));
    }

    @Test
    void sendEmail_ioException_shouldNotThrow() throws IOException {
        when(sendGrid.api(any(Request.class))).thenThrow(new IOException("Connection failed"));

        sendGridEmailService.sendEmail("user@test.com", "Test Subject", "<p>Hello</p>");

        verify(sendGrid).api(any(Request.class));
    }
}
