package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.ProductTagResponse;
import com.kamyaabi.service.ProductTagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/product-tags")
@Tag(name = "Product Tags", description = "Public product tag endpoints")
public class ProductTagController {

    private final ProductTagService productTagService;

    public ProductTagController(ProductTagService productTagService) {
        this.productTagService = productTagService;
    }

    @GetMapping
    @Operation(summary = "Get all product tags")
    public ResponseEntity<ApiResponse<List<ProductTagResponse>>> getAllTags() {
        return ResponseEntity.ok(ApiResponse.success(productTagService.getAllTags()));
    }
}
