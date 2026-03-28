package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.ProductMapper;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock private ProductRepository productRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ProductMapper productMapper;

    @InjectMocks private ProductServiceImpl productService;

    private Product product;
    private Category category;
    private ProductResponse productResponse;
    private ProductRequest productRequest;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(1L).name("Cashews").build();
        product = Product.builder()
                .id(1L).name("Whole Cashews").description("Premium")
                .price(new BigDecimal("899.00")).discountPrice(new BigDecimal("749.00"))
                .imageUrl("http://img.url").category(category)
                .stock(100).weight("500").unit("gm").active(true)
                .build();
        productResponse = ProductResponse.builder()
                .id(1L).name("Whole Cashews").price(new BigDecimal("899.00"))
                .categoryId(1L).categoryName("Cashews").stock(100).active(true)
                .build();
        productRequest = ProductRequest.builder()
                .name("Whole Cashews").description("Premium")
                .price(new BigDecimal("899.00")).categoryId(1L)
                .stock(100).weight("500").unit("gm").active(true)
                .build();
    }

    @Test
    void getAllProducts_shouldReturnPageOfProducts() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(List.of(product));
        when(productRepository.findByActiveTrue(pageable)).thenReturn(productPage);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        Page<ProductResponse> result = productService.getAllProducts(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Whole Cashews");
    }

    @Test
    void getProductsByCategory_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(List.of(product));
        when(productRepository.findByCategoryIdAndActiveTrue(1L, pageable)).thenReturn(productPage);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        Page<ProductResponse> result = productService.getProductsByCategory(1L, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void searchProducts_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(List.of(product));
        when(productRepository.searchByKeyword("cashew", pageable)).thenReturn(productPage);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        Page<ProductResponse> result = productService.searchProducts("cashew", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getProductById_existing_shouldReturnProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.getProductById(1L);

        assertThat(result.getName()).isEqualTo("Whole Cashews");
    }

    @Test
    void getProductById_notFound_shouldThrowException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getFeaturedProducts_shouldReturnList() {
        when(productRepository.findTop8ByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(product));
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        List<ProductResponse> result = productService.getFeaturedProducts();

        assertThat(result).hasSize(1);
    }

    @Test
    void createProduct_shouldReturnCreatedProduct() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productMapper.toEntity(productRequest, category)).thenReturn(product);
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.createProduct(productRequest);

        assertThat(result.getName()).isEqualTo("Whole Cashews");
        verify(productRepository).save(product);
    }

    @Test
    void createProduct_categoryNotFound_shouldThrowException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());
        productRequest.setCategoryId(999L);

        assertThatThrownBy(() -> productService.createProduct(productRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProduct_shouldReturnUpdatedProduct() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.updateProduct(1L, productRequest);

        assertThat(result.getName()).isEqualTo("Whole Cashews");
        verify(productMapper).updateEntity(product, productRequest, category);
    }

    @Test
    void updateProduct_productNotFound_shouldThrowException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.updateProduct(999L, productRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProduct_categoryNotFound_shouldThrowException() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.updateProduct(1L, productRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteProduct_shouldSoftDelete() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        productService.deleteProduct(1L);

        assertThat(product.getActive()).isFalse();
        verify(productRepository).save(product);
    }

    @Test
    void deleteProduct_notFound_shouldThrowException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.deleteProduct(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
