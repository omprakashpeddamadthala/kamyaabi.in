package com.kamyaabi.mapper;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .productCount(category.getProducts() != null ? category.getProducts().size() : 0)
                .build();
    }

    public Category toEntity(CategoryRequest request) {
        return Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build();
    }
}
