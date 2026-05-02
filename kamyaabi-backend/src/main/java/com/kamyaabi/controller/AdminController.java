package com.kamyaabi.controller;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.request.OrderStatusRequest;
import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.request.ProductStatusRequest;
import com.kamyaabi.dto.request.SettingsUpdateRequest;
import com.kamyaabi.dto.request.UpdateUserRoleRequest;
import com.kamyaabi.dto.request.UpdateUserStatusRequest;
import com.kamyaabi.dto.response.*;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.AdminUserService;
import com.kamyaabi.service.CategoryService;
import com.kamyaabi.service.DashboardService;
import com.kamyaabi.service.OrderService;
import com.kamyaabi.service.ProductService;
import com.kamyaabi.service.SettingsService;
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

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderService orderService;
    private final DashboardService dashboardService;
    private final AdminUserService adminUserService;
    private final SettingsService settingsService;
    private final CurrentUser currentUser;

    public AdminController(ProductService productService,
                           CategoryService categoryService,
                           OrderService orderService,
                           DashboardService dashboardService,
                           AdminUserService adminUserService,
                           SettingsService settingsService,
                           CurrentUser currentUser) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.orderService = orderService;
        this.dashboardService = dashboardService;
        this.adminUserService = adminUserService;
        this.settingsService = settingsService;
        this.currentUser = currentUser;
    }

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Dashboard stats",
            description = "Returns summary counts/revenue used on the admin dashboard header.")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats()));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Orders + revenue analytics",
            description = "Daily orders and revenue series for the inclusive range [startDate, endDate]. "
                    + "Both parameters are optional and default to the last 7 days.")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAnalytics(startDate, endDate)));
    }

    @GetMapping("/products")
    @Operation(summary = "List products (admin)",
            description = "Paginated product list including soft-deleted items. "
                    + "Supports optional `q` (search), `categoryId`, and `active` filters.")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean active) {
        org.springframework.data.domain.Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> products = productService.searchAdminProducts(q, categoryId, active, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "Get product by id (admin)",
            description = "Returns a single product (active or soft-deleted).")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getAdminProductById(id)));
    }

    @PostMapping("/products/{id}/restore")
    @Operation(summary = "Restore product",
            description = "Re-activate a soft-deleted product (Admin only)")
    public ResponseEntity<ApiResponse<ProductResponse>> restoreProduct(@PathVariable Long id) {
        ProductResponse product = productService.restoreProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product restored", product));
    }

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

    @PatchMapping("/products/{id}/status")
    @Operation(summary = "Toggle product status",
            description = "Flip a product's active flag without re-validating images or other fields (Admin only).")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStatus(
            @PathVariable Long id,
            @Valid @RequestBody ProductStatusRequest request) {
        ProductResponse product = productService.setProductActive(id, request.getActive());
        return ResponseEntity.ok(ApiResponse.success("Product status updated", product));
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

    @GetMapping("/categories")
    @Operation(summary = "List categories (paginated, admin)",
            description = "Paginated list of categories for admin tables. "
                    + "Parameters mirror the public endpoint but add pagination.")
    public ResponseEntity<ApiResponse<Page<CategoryResponse>>> listCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategoriesPaged(pageable)));
    }

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

    @GetMapping("/users")
    @Operation(summary = "List users (admin)",
            description = "Paginated list of users for the /admin/users table. Supports optional `q` search "
                    + "across email and name.")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String q) {
        org.springframework.data.domain.Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getAllUsers(q, pageable)));
    }

    @PatchMapping("/users/{id}/role")
    @Operation(summary = "Update user role",
            description = "Promote or demote a user between USER and ADMIN. Admins cannot change their own role.")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        AdminUserResponse user = adminUserService.updateUserRole(id, currentUser.getUserId(), request.getRole());
        return ResponseEntity.ok(ApiResponse.success("User role updated", user));
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Update user status",
            description = "Block or unblock a user account. Blocked users are denied login and "
                    + "all subsequent API calls. Admins cannot block themselves.")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        AdminUserResponse user = adminUserService.updateUserStatus(id, currentUser.getUserId(), request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("User status updated", user));
    }

    @GetMapping("/settings")
    @Operation(summary = "Get all platform settings",
            description = "Returns the full key/value map of admin-tunable platform settings "
                    + "(low stock threshold, products-per-page, bought-recently badge toggle).")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAll()));
    }

    @PutMapping("/settings")
    @Operation(summary = "Update platform settings",
            description = "Bulk key/value update. Unknown keys and invalid values are rejected with 400.")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateSettings(
            @Valid @RequestBody SettingsUpdateRequest request) {
        Map<String, String> updated = settingsService.updateAll(request.any());
        return ResponseEntity.ok(ApiResponse.success("Settings updated", updated));
    }
}
