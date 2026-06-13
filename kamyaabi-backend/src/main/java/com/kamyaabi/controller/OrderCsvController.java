package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.service.OrderCsvService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@Tag(name = "Order CSV", description = "Admin order CSV export/import")
public class OrderCsvController {

    private final OrderCsvService orderCsvService;

    public OrderCsvController(OrderCsvService orderCsvService) {
        this.orderCsvService = orderCsvService;
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export orders CSV",
            description = "Streams a CSV download of all orders with product details and SEO fields.")
    public void exportCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"orders_export_" + System.currentTimeMillis() + ".csv\"");
        orderCsvService.writeOrdersCsv(response.getWriter());
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import orders CSV",
            description = "Imports/updates orders from a CSV upload. Only provided fields are updated.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importCsv(
            @RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> summary = orderCsvService.importOrders(file.getInputStream());
        return ResponseEntity.ok(ApiResponse.success("CSV import completed", summary));
    }
}
