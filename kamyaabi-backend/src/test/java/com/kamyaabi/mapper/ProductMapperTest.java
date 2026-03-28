package com.kamyaabi.mapper;

import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ProductMapperTest {

    private final ProductMapper productMapper = new ProductMapper();

    @Test
    void toResponse_shouldMapAllFields() {
        Category category = Category.builder().id(1L).name("Cashews").build();
        Product product = Product.builder()
                .id(1L).name("Whole Cashews").description("Premium")
                .price(new BigDecimal("899.00")).discountPrice(new BigDecimal("749.00"))
                .imageUrl("http://img.url").category(category)
                .stock(100).weight("500").unit("gm").active(true)
                .build();

        ProductResponse response = productMapper.toResponse(product);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Whole Cashews");
        assertThat(response.getDescription()).isEqualTo("Premium");
        assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("899.00"));
        assertThat(response.getDiscountPrice()).isEqualByComparingTo(new BigDecimal("749.00"));
        assertThat(response.getImageUrl()).isEqualTo("http://img.url");
        assertThat(response.getCategoryId()).isEqualTo(1L);
        assertThat(response.getCategoryName()).isEqualTo("Cashews");
        assertThat(response.getStock()).isEqualTo(100);
        assertThat(response.getWeight()).isEqualTo("500");
        assertThat(response.getUnit()).isEqualTo("gm");
        assertThat(response.getActive()).isTrue();
    }

    @Test
    void toEntity_shouldMapAllFields() {
        Category category = Category.builder().id(1L).name("Cashews").build();
        ProductRequest request = ProductRequest.builder()
                .name("Whole Cashews").description("Premium")
                .price(new BigDecimal("899.00")).discountPrice(new BigDecimal("749.00"))
                .imageUrl("http://img.url").categoryId(1L)
                .stock(100).weight("500").unit("gm").active(true)
                .build();

        Product product = productMapper.toEntity(request, category);

        assertThat(product.getName()).isEqualTo("Whole Cashews");
        assertThat(product.getCategory()).isEqualTo(category);
        assertThat(product.getStock()).isEqualTo(100);
        assertThat(product.getActive()).isTrue();
    }

    @Test
    void toEntity_nullActive_shouldDefaultToTrue() {
        Category category = Category.builder().id(1L).name("Cashews").build();
        ProductRequest request = ProductRequest.builder()
                .name("Whole Cashews").description("Premium")
                .price(new BigDecimal("899.00"))
                .categoryId(1L).stock(100).weight("500").unit("gm")
                .build();

        Product product = productMapper.toEntity(request, category);

        assertThat(product.getActive()).isTrue();
    }

    @Test
    void updateEntity_shouldUpdateAllFields() {
        Category category = Category.builder().id(1L).name("Cashews").build();
        Category newCategory = Category.builder().id(2L).name("Almonds").build();
        Product product = Product.builder()
                .id(1L).name("Old Name").description("Old")
                .price(new BigDecimal("100.00")).category(category)
                .stock(10).weight("100").unit("gm").active(true)
                .build();
        ProductRequest request = ProductRequest.builder()
                .name("New Name").description("New")
                .price(new BigDecimal("200.00")).discountPrice(new BigDecimal("150.00"))
                .imageUrl("http://new.url").categoryId(2L)
                .stock(50).weight("250").unit("kg").active(false)
                .build();

        productMapper.updateEntity(product, request, newCategory);

        assertThat(product.getName()).isEqualTo("New Name");
        assertThat(product.getDescription()).isEqualTo("New");
        assertThat(product.getPrice()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(product.getCategory()).isEqualTo(newCategory);
        assertThat(product.getActive()).isFalse();
    }

    @Test
    void updateEntity_nullActive_shouldNotChangeActive() {
        Category category = Category.builder().id(1L).name("Cashews").build();
        Product product = Product.builder()
                .id(1L).name("Old").active(true).category(category)
                .price(new BigDecimal("100.00")).stock(10).build();
        ProductRequest request = ProductRequest.builder()
                .name("New").description("Desc")
                .price(new BigDecimal("200.00")).categoryId(1L)
                .stock(20).weight("500").unit("gm")
                .build();

        productMapper.updateEntity(product, request, category);

        assertThat(product.getActive()).isTrue();
    }
}
