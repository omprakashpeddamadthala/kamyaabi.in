package com.kamyaabi.mapper;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CategoryMapperTest {

    private final CategoryMapper categoryMapper = new CategoryMapper();

    @Test
    void toResponse_shouldMapAllFields() {
        Category category = Category.builder()
                .id(1L).name("Cashews").description("Premium cashews").imageUrl("http://img.url")
                .products(new ArrayList<>())
                .build();

        CategoryResponse response = categoryMapper.toResponse(category);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Cashews");
        assertThat(response.getDescription()).isEqualTo("Premium cashews");
        assertThat(response.getImageUrl()).isEqualTo("http://img.url");
        assertThat(response.getProductCount()).isEqualTo(0);
    }

    @Test
    void toResponse_withProducts_shouldCountProducts() {
        Product product1 = Product.builder().id(1L).name("P1").build();
        Product product2 = Product.builder().id(2L).name("P2").build();
        Category category = Category.builder()
                .id(1L).name("Cashews").description("Premium")
                .products(List.of(product1, product2))
                .build();

        CategoryResponse response = categoryMapper.toResponse(category);

        assertThat(response.getProductCount()).isEqualTo(2);
    }

    @Test
    void toResponse_nullProducts_shouldReturnZeroCount() {
        Category category = Category.builder()
                .id(1L).name("Cashews").description("Premium")
                .build();

        CategoryResponse response = categoryMapper.toResponse(category);

        assertThat(response.getProductCount()).isEqualTo(0);
    }

    @Test
    void toEntity_shouldMapAllFields() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Cashews").description("Premium cashews").imageUrl("http://img.url")
                .build();

        Category category = categoryMapper.toEntity(request);

        assertThat(category.getName()).isEqualTo("Cashews");
        assertThat(category.getDescription()).isEqualTo("Premium cashews");
        assertThat(category.getImageUrl()).isEqualTo("http://img.url");
    }
}
