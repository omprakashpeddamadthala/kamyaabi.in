package com.kamyaabi.controller;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.request.OrderStatusRequest;
import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.*;
import com.kamyaabi.service.CategoryService;
import com.kamyaabi.service.OrderService;
import com.kamyaabi.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderService orderService;

    public AdminController(ProductService productService,
                           CategoryService categoryService,
                           OrderService orderService) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.orderService = orderService;
    }

    // Product Management
    @PostMapping(value = "/products", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create product",
            description = "Create a new product with one or more uploaded images (Admin only). "
                    + "Send a `product` JSON part plus one or more `images` file parts.")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestPart("product") ProductRequest request,
            @RequestPart("images") List<MultipartFile> images,
            @RequestParam(value = "mainImageIndex", defaultValue = "0") int mainImageIndex) {
        ProductResponse product = productService.createProduct(request, images, mainImageIndex);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created", product));
    }

    @PutMapping(value = "/products/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update product",
            description = "Update an existing product (Admin only). "
                    + "Send a `product` JSON part; optionally include new `images` file parts "
                    + "and a `mainImageId` to change which existing image is the main one.")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestPart("product") ProductRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> newImages,
            @RequestParam(value = "mainImageId", required = false) Long mainImageId) {
        ProductResponse product = productService.updateProduct(
                id, request, newImages == null ? Collections.emptyList() : newImages, mainImageId);
        return ResponseEntity.ok(ApiResponse.success("Product updated", product));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Delete product", description = "Soft-delete a product (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted", null));
    }

    @DeleteMapping("/products/{id}/images/{imageId}")
    @Operation(summary = "Delete product image",
            description = "Remove a single image from a product (Admin only). "
                    + "Deletes the asset from Cloudinary and the DB record.")
    public ResponseEntity<ApiResponse<Void>> deleteProductImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        productService.deleteProductImage(id, imageId);
        return ResponseEntity.ok(ApiResponse.success("Image deleted", null));
    }

    // Category Management
    @PostMapping("/categories")
    @Operation(summary = "Create category", description = "Create a new category (Admin only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created", category));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update category", description = "Update an existing category (Admin only)")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated", category));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Delete category", description = "Delete a category (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }

    // Order Management
    @GetMapping("/orders")
    @Operation(summary = "Get all orders", description = "Get paginated list of all orders with optional status filter (Admin only)")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> orders;
        if (status != null && !status.isBlank()) {
            try {
                com.kamyaabi.entity.Order.OrderStatus orderStatus =
                        com.kamyaabi.entity.Order.OrderStatus.valueOf(status.toUpperCase());
                orders = orderService.getOrdersByStatus(orderStatus, pageable);
            } catch (IllegalArgumentException e) {
                orders = orderService.getAllOrders(pageable);
            }
        } else {
            orders = orderService.getAllOrders(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PutMapping("/orders/{id}/status")
    @Operation(summary = "Update order status", description = "Update order status (Admin only)")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusRequest request) {
        OrderResponse order = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Order status updated", order));
    }
}
