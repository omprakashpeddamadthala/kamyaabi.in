package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.email.ErrorAlertService;
import com.kamyaabi.exception.GlobalExceptionHandler;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.service.ProductService;
import com.kamyaabi.service.SettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock private ProductService productService;
    @Mock private SettingsService settingsService;

    @InjectMocks private ProductController productController;
    private MockMvc mockMvc;

    private final ProductResponse productResponse = ProductResponse.builder()
            .id(1L).name("Cashews").price(new BigDecimal("899.00")).build();

    @BeforeEach
    void setUp() {
        @SuppressWarnings("unchecked")
        ObjectProvider<ErrorAlertService> errorAlertProvider = org.mockito.Mockito.mock(ObjectProvider.class);
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalExceptionHandler(errorAlertProvider))
                .build();
    }

    @Test
    void getAllProducts_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.getAllProducts(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getAllProducts(0, 12, null, "createdAt", "desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getAllProducts_ascendingSort_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.getAllProducts(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getAllProducts(0, 12, null, "name", "asc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getAllProducts_priceAscSort_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(settingsService.getInt(SettingsService.PRODUCTS_PER_PAGE,
                SettingsService.DEFAULT_PRODUCTS_PER_PAGE)).thenReturn(8);
        when(productService.getAllProducts(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getAllProducts(0, null, "price_asc", "createdAt", "desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getAllProducts_unspecifiedSize_shouldUseSettingsService() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(settingsService.getInt(SettingsService.PRODUCTS_PER_PAGE,
                SettingsService.DEFAULT_PRODUCTS_PER_PAGE)).thenReturn(8);
        when(productService.getAllProducts(any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getAllProducts(0, null, null, "createdAt", "desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getProductById_shouldReturnProduct() {
        when(productService.getProductById(1L)).thenReturn(productResponse);

        ResponseEntity<?> response = productController.getProductById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getProductBySlug_existing_shouldReturn200WithPublicCacheHeaders() throws Exception {
        when(productService.getProductBySlug("cashews")).thenReturn(productResponse);

        mockMvc.perform(get("/api/products/slug/cashews"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, must-revalidate, public"))
                .andExpect(jsonPath("$.data.name").value("Cashews"));
    }

    @Test
    void getProductBySlug_missing_shouldReturn404() throws Exception {
        when(productService.getProductBySlug("missing"))
                .thenThrow(new ResourceNotFoundException("Product not found"));

        mockMvc.perform(get("/api/products/slug/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getProductsByCategory_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.getProductsByCategory(eq(1L), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.getProductsByCategory(1L, 0, 12, null, "createdAt", "desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void searchProducts_shouldReturnPage() {
        Page<ProductResponse> page = new PageImpl<>(List.of(productResponse));
        when(productService.searchProducts(eq("cashew"), any(Pageable.class))).thenReturn(page);

        ResponseEntity<?> response = productController.searchProducts("cashew", 0, 12, null, "createdAt", "desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getFeaturedProducts_shouldReturnList() {
        when(productService.getFeaturedProducts()).thenReturn(List.of(productResponse));

        ResponseEntity<?> response = productController.getFeaturedProducts();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
