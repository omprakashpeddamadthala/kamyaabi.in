package com.kamyaabi.service;

import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {
    Page<ProductResponse> getAllProducts(Pageable pageable);
    Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable);
    Page<ProductResponse> searchProducts(String keyword, Pageable pageable);
    ProductResponse getProductById(Long id);
    List<ProductResponse> getFeaturedProducts();
    ProductResponse createProduct(ProductRequest request);
    ProductResponse updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
