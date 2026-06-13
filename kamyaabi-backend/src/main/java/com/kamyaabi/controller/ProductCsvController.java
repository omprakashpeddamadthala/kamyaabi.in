package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.service.ProductCsvService;
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
@RequestMapping("/api/admin/products")
@Tag(name = "Product CSV", description = "Admin product CSV export/import")
public class ProductCsvController {

    private final ProductCsvService productCsvService;

    public ProductCsvController(ProductCsvService productCsvService) {
        this.productCsvService = productCsvService;
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export products CSV", description = "Streams a CSV download of all products with SEO fields.")
    public void exportCsv(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"products.csv\"");
        productCsvService.writeProductsCsv(response.getWriter());
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import products CSV", description = "Imports/updates products from a CSV upload. Returns summary of created/updated/errors.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importCsv(
            @RequestParam("file") MultipartFile file) throws IOException {
        Map<String, Object> summary = productCsvService.importProducts(file.getInputStream());
        return ResponseEntity.ok(ApiResponse.success("CSV import completed", summary));
    }
}
