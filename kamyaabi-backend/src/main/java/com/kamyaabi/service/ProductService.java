package com.kamyaabi.service;

import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductService {
    Page<ProductResponse> getAllProducts(Pageable pageable);
    Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable);
    Page<ProductResponse> searchProducts(String keyword, Pageable pageable);
    ProductResponse getProductById(Long id);
    List<ProductResponse> getFeaturedProducts();

    /**
     * Create a product and upload its image(s) to Cloudinary.
     *
     * @param request        product field values
     * @param images         uploaded image files — must contain at least one entry and at most the configured max
     * @param mainImageIndex 0-based index into {@code images} for the image flagged as main (clamped to range)
     */
    ProductResponse createProduct(ProductRequest request, List<MultipartFile> images, int mainImageIndex);

    /**
     * Update a product; optionally append new image uploads and/or change which
     * existing image is the main one. Existing images are preserved unless
     * removed via {@link #deleteProductImage(Long, Long)}.
     *
     * @param id           product id
     * @param request      new product field values
     * @param newImages    optional freshly uploaded images to append
     * @param mainImageId  optional — id of an existing image to set as main
     */
    ProductResponse updateProduct(Long id,
                                  ProductRequest request,
                                  List<MultipartFile> newImages,
                                  Long mainImageId);

    void deleteProduct(Long id);

    /**
     * Remove a single image from a product: deletes the asset from Cloudinary
     * (best-effort — logs warning on failure) and the DB record.
     */
    void deleteProductImage(Long productId, Long imageId);

    /**
     * Admin-side paginated search that includes soft-deleted (inactive)
     * products. {@code keyword}, {@code categoryId}, and {@code active} are all
     * optional — pass {@code null} (or empty keyword) to drop a filter.
     */
    Page<ProductResponse> searchAdminProducts(String keyword,
                                              Long categoryId,
                                              Boolean active,
                                              Pageable pageable);

    /** Admin fetch by id; returns the product even if it is soft-deleted. */
    ProductResponse getAdminProductById(Long id);

    /** Re-activate a soft-deleted product. */
    ProductResponse restoreProduct(Long id);
}
