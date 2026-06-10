package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductCsvControllerTest {

    @Mock private ProductRepository productRepository;
    @Mock private CategoryRepository categoryRepository;

    @InjectMocks private ProductCsvController productCsvController;

    @Test
    void exportCsv_shouldWriteCsvToResponse() throws Exception {
        Category category = new Category();
        category.setId(1L);
        category.setName("Cashews");

        Product product = new Product();
        product.setId(1L);
        product.setName("Whole Cashews");
        product.setSlug("whole-cashews");
        product.setDescription("Premium cashews");
        product.setPrice(new BigDecimal("899.00"));
        product.setDiscountPrice(new BigDecimal("799.00"));
        product.setStock(100);
        product.setWeight("250g");
        product.setCategory(category);
        product.setActive(true);
        product.setImageUrl("https://cdn.example.com/img.jpg");
        product.setSeoTitle("Cashews SEO");
        product.setSeoDescription("SEO description");
        product.setSeoKeywords("cashews,nuts");
        product.setCanonicalUrl("/products/whole-cashews");
        product.setOgImageUrl("https://cdn.example.com/og.jpg");

        when(productRepository.findAll()).thenReturn(List.of(product));

        MockHttpServletResponse response = new MockHttpServletResponse();
        productCsvController.exportCsv(response);

        assertThat(response.getContentType()).isEqualTo("text/csv");
        String csv = response.getContentAsString();
        assertThat(csv).contains("id,name,slug");
        assertThat(csv).contains("Whole Cashews");
        assertThat(csv).contains("899.00");
    }

    @Test
    void exportCsv_withNullCategory_shouldHandleGracefully() throws Exception {
        Product product = new Product();
        product.setId(2L);
        product.setName("No Category Product");
        product.setPrice(new BigDecimal("100.00"));
        product.setCategory(null);
        product.setActive(true);

        when(productRepository.findAll()).thenReturn(List.of(product));

        MockHttpServletResponse response = new MockHttpServletResponse();
        productCsvController.exportCsv(response);

        String csv = response.getContentAsString();
        assertThat(csv).contains("No Category Product");
    }

    @Test
    @SuppressWarnings("unchecked")
    void importCsv_shouldCreateNewProduct() throws Exception {
        String csvContent = "id,name,slug,description,price,salePrice,stock,sku,categoryId,categoryName,isActive,imageUrl,metaTitle,metaDescription,metaKeywords,canonicalUrl,ogTitle,ogDescription,ogImage\n"
                + ",New Product,new-product,A new product,499.00,,50,SKU-NEW,1,Cashews,true,https://img.jpg,,,,,,,\n";
        MockMultipartFile file = new MockMultipartFile("file", "products.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        Category category = new Category();
        category.setId(1L);
        category.setName("Cashews");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = productCsvController.importCsv(file);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        Map<String, Object> data = response.getBody().data();
        assertThat(data.get("created")).isEqualTo(1);
        assertThat(data.get("updated")).isEqualTo(0);
        assertThat((List<String>) data.get("errors")).isEmpty();
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void importCsv_shouldUpdateExistingProductById() throws Exception {
        String csvContent = "id,name,slug,description,price,salePrice,stock,sku,categoryId,categoryName,isActive,imageUrl,metaTitle,metaDescription,metaKeywords,canonicalUrl,ogTitle,ogDescription,ogImage\n"
                + "5,Updated Product,updated-product,Updated desc,599.00,,30,,1,Cashews,true,,,,,,,,,\n";
        MockMultipartFile file = new MockMultipartFile("file", "products.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        Product existing = new Product();
        existing.setId(5L);
        existing.setName("Old Product");
        Category category = new Category();
        category.setId(1L);
        existing.setCategory(category);
        when(productRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = productCsvController.importCsv(file);

        Map<String, Object> data = response.getBody().data();
        assertThat(data.get("created")).isEqualTo(0);
        assertThat(data.get("updated")).isEqualTo(1);
        assertThat((List<String>) data.get("errors")).isEmpty();
    }

    @Test
    @SuppressWarnings("unchecked")
    void importCsv_shouldUpdateExistingProductBySlug() throws Exception {
        String csvContent = "id,name,slug,description,price,salePrice,stock,sku,categoryId,categoryName,isActive,imageUrl,metaTitle,metaDescription,metaKeywords,canonicalUrl,ogTitle,ogDescription,ogImage\n"
                + ",Slug Match,slug-match,Matched by slug,299.00,,10,,1,Cashews,true,,,,,,,,,\n";
        MockMultipartFile file = new MockMultipartFile("file", "products.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        Product existing = new Product();
        existing.setId(3L);
        existing.setName("Old Name");
        Category category = new Category();
        category.setId(1L);
        existing.setCategory(category);
        when(productRepository.findBySlug("slug-match")).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = productCsvController.importCsv(file);

        Map<String, Object> data = response.getBody().data();
        assertThat(data.get("updated")).isEqualTo(1);
        assertThat(data.get("created")).isEqualTo(0);
    }

    @Test
    @SuppressWarnings("unchecked")
    void importCsv_missingName_shouldReportError() throws Exception {
        String csvContent = "id,name,slug,description,price,salePrice,stock,sku,categoryId,categoryName,isActive,imageUrl,metaTitle,metaDescription,metaKeywords,canonicalUrl,ogTitle,ogDescription,ogImage\n"
                + ",,some-slug,,499.00,,50,,1,Cashews,true,,,,,,,,,\n";
        MockMultipartFile file = new MockMultipartFile("file", "products.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = productCsvController.importCsv(file);

        Map<String, Object> data = response.getBody().data();
        assertThat(data.get("created")).isEqualTo(0);
        assertThat(data.get("updated")).isEqualTo(0);
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).hasSize(1);
        assertThat(errors.get(0)).contains("missing required field 'name'");
    }

    @Test
    @SuppressWarnings("unchecked")
    void importCsv_missingPrice_shouldReportError() throws Exception {
        String csvContent = "id,name,slug,description,price,salePrice,stock,sku,categoryId,categoryName,isActive,imageUrl,metaTitle,metaDescription,metaKeywords,canonicalUrl,ogTitle,ogDescription,ogImage\n"
                + ",Valid Name,slug,desc,,,50,,1,Cashews,true,,,,,,,,,\n";
        MockMultipartFile file = new MockMultipartFile("file", "products.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = productCsvController.importCsv(file);

        Map<String, Object> data = response.getBody().data();
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).hasSize(1);
        assertThat(errors.get(0)).contains("missing required field 'price'");
    }

    @Test
    @SuppressWarnings("unchecked")
    void importCsv_missingCategoryForNewProduct_shouldReportError() throws Exception {
        String csvContent = "id,name,slug,description,price,salePrice,stock,sku,categoryId,categoryName,isActive,imageUrl,metaTitle,metaDescription,metaKeywords,canonicalUrl,ogTitle,ogDescription,ogImage\n"
                + ",Orphan Product,orphan,,399.00,,10,,,,true,,,,,,,,,\n";
        MockMultipartFile file = new MockMultipartFile("file", "products.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = productCsvController.importCsv(file);

        Map<String, Object> data = response.getBody().data();
        List<String> errors = (List<String>) data.get("errors");
        assertThat(errors).hasSize(1);
        assertThat(errors.get(0)).contains("missing or invalid categoryId");
    }
}
