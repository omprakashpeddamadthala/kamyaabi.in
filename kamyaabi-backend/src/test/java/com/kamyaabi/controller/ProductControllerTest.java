package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock private ProductService productService;

    @InjectMocks private ProductController productController;

    private final ProductResponse productResponse = ProductResponse.builder()
            .id(1L).name("Cashews").price(new BigDecimal("899.00")).build();

    @Test
    void getAllProducts_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.getAllProducts(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getAllProducts(0, 12, "createdAt", "desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getAllProducts_ascendingSort_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.getAllProducts(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getAllProducts(0, 12, "name", "asc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getProductById_shouldReturnProduct() {
        when(productService.getProductById(1L)).thenReturn(productResponse);

        ResponseEntity<?> response = productController.getProductById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getProductsByCategory_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.getProductsByCategory(eq(1L), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getProductsByCategory(1L, 0, 12);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void searchProducts_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.searchProducts(eq("cashew"), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.searchProducts("cashew", 0, 12);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getFeaturedProducts_shouldReturnList() {
        when(productService.getFeaturedProducts()).thenReturn(List.of(productResponse));

        ResponseEntity<?> response = productController.getFeaturedProducts();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
