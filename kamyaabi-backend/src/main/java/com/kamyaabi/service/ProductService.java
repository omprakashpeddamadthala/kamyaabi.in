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

    ProductResponse getProductBySlug(String slug);

    String getSlugForId(Long id);

    List<ProductResponse> getFeaturedProducts();

    ProductResponse createProduct(ProductRequest request, List<MultipartFile> images, int mainImageIndex);

    ProductResponse updateProduct(Long id,
                                  ProductRequest request,
                                  List<MultipartFile> newImages,
                                  Long mainImageId);

    void deleteProduct(Long id);

    void deleteProductImage(Long productId, Long imageId);

    Page<ProductResponse> searchAdminProducts(String keyword,
                                              Long categoryId,
                                              Boolean active,
                                              Pageable pageable);

    ProductResponse getAdminProductById(Long id);

    ProductResponse restoreProduct(Long id);

    ProductResponse setProductActive(Long id, boolean active);
}
