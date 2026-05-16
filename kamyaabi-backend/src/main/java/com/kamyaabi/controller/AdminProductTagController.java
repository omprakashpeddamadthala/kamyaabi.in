package com.kamyaabi.controller;

import com.kamyaabi.dto.request.ProductTagRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.ProductTagResponse;
import com.kamyaabi.service.ProductTagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/product-tags")
@Tag(name = "Admin Product Tags", description = "Admin product tag management endpoints")
public class AdminProductTagController {

    private final ProductTagService productTagService;

    public AdminProductTagController(ProductTagService productTagService) {
        this.productTagService = productTagService;
    }

    @GetMapping
    @Operation(summary = "List all product tags")
    public ResponseEntity<ApiResponse<List<ProductTagResponse>>> getAllTags() {
        return ResponseEntity.ok(ApiResponse.success(productTagService.getAllTags()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product tag by ID")
    public ResponseEntity<ApiResponse<ProductTagResponse>> getTag(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productTagService.getTagById(id)));
    }

    @PostMapping
    @Operation(summary = "Create product tag")
    public ResponseEntity<ApiResponse<ProductTagResponse>> createTag(
            @Valid @RequestBody ProductTagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product tag created", productTagService.createTag(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product tag")
    public ResponseEntity<ApiResponse<ProductTagResponse>> updateTag(
            @PathVariable Long id,
            @Valid @RequestBody ProductTagRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product tag updated", productTagService.updateTag(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product tag")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long id) {
        productTagService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.success("Product tag deleted", null));
    }

    @PostMapping("/{sourceId}/merge/{targetId}")
    @Operation(summary = "Merge product tags", description = "Merge source tag into target tag")
    public ResponseEntity<ApiResponse<Void>> mergeTags(
            @PathVariable Long sourceId,
            @PathVariable Long targetId) {
        productTagService.mergeTags(sourceId, targetId);
        return ResponseEntity.ok(ApiResponse.success("Tags merged", null));
    }
}
