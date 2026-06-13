package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.service.OrderCsvService;
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
class OrderCsvControllerTest {

    @Mock
    private OrderCsvService orderCsvService;

    @InjectMocks
    private OrderCsvController orderCsvController;

    @Test
    void exportCsv_setsHeadersAndDelegatesToService() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        orderCsvController.exportCsv(response);

        assertThat(response.getContentType()).isEqualTo("text/csv");
        assertThat(response.getHeader("Content-Disposition")).contains("orders_export_");
        verify(orderCsvService).writeOrdersCsv(any(Writer.class));
    }

    @Test
    void importCsv_delegatesToServiceAndWrapsSummary() throws Exception {
        Map<String, Object> summary = Map.of("totalRows", 3, "updatedOrders", 2);
        when(orderCsvService.importOrders(any())).thenReturn(summary);

        MockMultipartFile file = new MockMultipartFile("file", "orders.csv",
                "text/csv", "order_id\n1\n".getBytes(StandardCharsets.UTF_8));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = orderCsvController.importCsv(file);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data()).isEqualTo(summary);
        verify(orderCsvService).importOrders(any());
    }
}
