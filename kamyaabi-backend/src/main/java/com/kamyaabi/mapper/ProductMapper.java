package com.kamyaabi.mapper;

import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .imageUrl(product.getImageUrl())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .stock(product.getStock())
                .weight(product.getWeight())
                .unit(product.getUnit())
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .build();
    }

    public Product toEntity(ProductRequest request, Category category) {
        return Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .imageUrl(request.getImageUrl())
                .category(category)
                .stock(request.getStock())
                .weight(request.getWeight())
                .unit(request.getUnit())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
    }

    public void updateEntity(Product product, ProductRequest request, Category category) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(category);
        product.setStock(request.getStock());
        product.setWeight(request.getWeight());
        product.setUnit(request.getUnit());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
    }
}
