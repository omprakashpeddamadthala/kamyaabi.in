package com.kamyaabi.exception;

import com.kamyaabi.config.CorrelationIdFilter;
import com.kamyaabi.dto.response.ApiErrorResponse;
import org.apache.catalina.connector.ClientAbortException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/test");
        MDC.put(CorrelationIdFilter.MDC_KEY, "test-trace-id");
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    void handleResourceNotFound_shouldReturn404WithTraceId() {
        ResponseEntity<ApiErrorResponse> response = handler.handleResourceNotFound(
                new ResourceNotFoundException("Product not found"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        ApiErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getStatus()).isEqualTo(404);
        assertThat(body.getError()).isEqualTo("Not Found");
        assertThat(body.getMessage()).isEqualTo("Product not found");
        assertThat(body.getPath()).isEqualTo("/api/test");
        assertThat(body.getTraceId()).isEqualTo("test-trace-id");
        assertThat(body.getTimestamp()).isNotNull();
        assertThat(body.getFieldErrors()).isNull();
    }

    @Test
    void handleBadRequest_shouldReturn400() {
        ResponseEntity<ApiErrorResponse> response = handler.handleBadRequest(
                new BadRequestException("Invalid input"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Invalid input");
    }

    @Test
    void handleDuplicateResource_shouldReturn409() {
        ResponseEntity<ApiErrorResponse> response = handler.handleDuplicateResource(
                new DuplicateResourceException("Category already exists"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Category already exists");
    }

    @Test
    void handlePayment_shouldReturn400() {
        ResponseEntity<ApiErrorResponse> response = handler.handlePayment(
                new PaymentException("Payment failed"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Payment failed");
    }

    @Test
    void handleBusiness_shouldReturn422() {
        ResponseEntity<ApiErrorResponse> response = handler.handleBusiness(
                new BusinessException("Cannot cancel shipped order"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Cannot cancel shipped order");
    }

    @Test
    void handleUnauthorized_shouldReturn401() {
        ResponseEntity<ApiErrorResponse> response = handler.handleUnauthorized(
                new UnauthorizedException("Token expired"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Token expired");
    }

    @Test
    void handleAccessDenied_shouldReturn403WithSanitisedMessage() {
        ResponseEntity<ApiErrorResponse> response = handler.handleAccessDenied(
                new AccessDeniedException("Forbidden"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Access denied");
    }

    @Test
    void handleValidation_shouldReturn400WithFieldErrors() throws NoSuchMethodException {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "object");
        bindingResult.addError(new FieldError("object", "name", "must not be blank"));
        bindingResult.addError(new FieldError("object", "price", "must be positive"));
        MethodParameter parameter = new MethodParameter(
                this.getClass().getDeclaredMethod("handleValidation_shouldReturn400WithFieldErrors"), -1);
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<ApiErrorResponse> response = handler.handleValidation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        ApiErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getMessage()).isEqualTo("Validation failed");
        assertThat(body.getFieldErrors())
                .containsEntry("name", "must not be blank")
                .containsEntry("price", "must be positive");
    }

    @Test
    void handleClientAbort_shouldNotThrow() {
        handler.handleClientAbort(new ClientAbortException(new IOException("Broken pipe")));
    }

    @Test
    void handleGeneric_shouldReturn500WithSanitisedMessage() {
        ResponseEntity<ApiErrorResponse> response = handler.handleGeneric(
                new RuntimeException("Something went wrong"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("unexpected error");
        assertThat(response.getBody().getTraceId()).isEqualTo("test-trace-id");
    }
}
