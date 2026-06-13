package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.service.ProductCsvService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductCsvControllerTest {

    @Mock
    private ProductCsvService productCsvService;

    @InjectMocks
    private ProductCsvController productCsvController;

    @Test
    void exportCsv_setsHeadersAndDelegatesToService() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        productCsvController.exportCsv(response);

        assertThat(response.getContentType()).isEqualTo("text/csv");
        assertThat(response.getHeader("Content-Disposition")).contains("products.csv");
        verify(productCsvService).writeProductsCsv(any(Writer.class));
    }

    @Test
    void importCsv_delegatesToServiceAndWrapsSummary() throws Exception {
        Map<String, Object> summary = Map.of("created", 1, "updated", 0);
        when(productCsvService.importProducts(any())).thenReturn(summary);

        MockMultipartFile file = new MockMultipartFile("file", "products.csv",
                "text/csv", "id,name\n,X\n".getBytes(StandardCharsets.UTF_8));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = productCsvController.importCsv(file);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data()).isEqualTo(summary);
        verify(productCsvService).importProducts(any());
    }
}
