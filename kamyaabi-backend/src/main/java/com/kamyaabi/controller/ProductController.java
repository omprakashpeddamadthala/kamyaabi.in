package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.service.ProductService;
import com.kamyaabi.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Duration;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Product browsing endpoints")
public class ProductController {

    private final ProductService productService;
    private final SettingsService settingsService;

    public ProductController(ProductService productService,
                             SettingsService settingsService) {
        this.productService = productService;
        this.settingsService = settingsService;
    }

    /**
     * Maps a frontend-friendly {@code sort} query param (e.g. {@code price_asc},
     * {@code newest}) to a Spring Data {@link Sort}. Falls back to legacy
     * {@code sortBy}+{@code sortDir} pair when {@code sort} is absent so existing
     * callers stay green.
     */
    static Sort resolveSort(String sort, String sortBy, String sortDir) {
        if (sort != null && !sort.isBlank()) {
            return switch (sort.toLowerCase()) {
                case "price_asc" -> Sort.by("price").ascending();
                case "price_desc" -> Sort.by("price").descending();
                case "name_asc" -> Sort.by("name").ascending();
                case "name_desc" -> Sort.by("name").descending();
                case "oldest" -> Sort.by("createdAt").ascending();
                case "newest" -> Sort.by("createdAt").descending();
                default -> Sort.by("createdAt").descending();
            };
        }
        String safeSortBy = switch (sortBy == null ? "" : sortBy) {
            case "price", "name", "createdAt" -> sortBy;
            default -> "createdAt";
        };
        return "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();
    }

    private int resolveSize(Integer requested) {
        if (requested != null && requested > 0) return requested;
        return settingsService.getInt(
                SettingsService.PRODUCTS_PER_PAGE,
                SettingsService.DEFAULT_PRODUCTS_PER_PAGE);
    }

    @GetMapping
    @Operation(summary = "Get all products",
            description = "Get paginated list of active products. Pass `sort` for one of "
                    + "price_asc, price_desc, name_asc, name_desc, newest, oldest. "
                    + "`size` defaults to the admin-configured `products_per_page` setting (8 when unset).")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Pageable pageable = PageRequest.of(page, resolveSize(size), resolveSort(sort, sortBy, sortDir));
        Page<ProductResponse> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get product by slug",
            description = "Fetch a product by its URL-friendly slug (preferred over numeric id).")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(@PathVariable String slug) {
        ProductResponse product = productService.getProductBySlug(slug);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic().mustRevalidate())
                .body(ApiResponse.success(product));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID",
            description = "Legacy endpoint kept for backward compatibility; "
                    + "redirects to /products/slug/{slug} when called with only a numeric id in the frontend route.")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic().mustRevalidate())
                .body(ApiResponse.success(product));
    }

    @GetMapping("/{id}/redirect")
    @Operation(summary = "Resolve numeric id to canonical slug URL",
            description = "Issues a 301 Moved Permanently to /products/slug/{slug}; "
                    + "used for SEO backward compatibility with legacy /products/:id URLs.")
    public ResponseEntity<Void> redirectIdToSlug(@PathVariable Long id) {
        String slug = productService.getSlugForId(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create("/api/products/slug/" + slug));
        return new ResponseEntity<>(headers, HttpStatus.MOVED_PERMANENTLY);
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get products by category",
            description = "Get paginated products filtered by category. Honors the same `sort` "
                    + "vocabulary as the listing endpoint and the configurable `products_per_page` setting.")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProductsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Pageable pageable = PageRequest.of(page, resolveSize(size), resolveSort(sort, sortBy, sortDir));
        Page<ProductResponse> products = productService.getProductsByCategory(categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products",
            description = "Search products by keyword. Honors the same `sort` vocabulary as the listing "
                    + "endpoint and the configurable `products_per_page` setting.")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Pageable pageable = PageRequest.of(page, resolveSize(size), resolveSort(sort, sortBy, sortDir));
        Page<ProductResponse> products = productService.searchProducts(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured products", description = "Get latest featured products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeaturedProducts() {
        List<ProductResponse> products = productService.getFeaturedProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }
}
