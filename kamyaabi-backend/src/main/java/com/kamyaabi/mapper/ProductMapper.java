package com.kamyaabi.mapper;

import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductImageResponse;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.ProductImage;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class ProductMapper {

    private final ProductImageMapper productImageMapper;

    public ProductMapper(ProductImageMapper productImageMapper) {
        this.productImageMapper = productImageMapper;
    }

    public ProductResponse toResponse(Product product) {
        List<ProductImage> images = product.getImages() == null
                ? Collections.emptyList()
                : product.getImages();
        List<ProductImageResponse> imageResponses = images.stream()
                .map(productImageMapper::toResponse)
                .toList();
        String mainImageUrl = resolveMainImageUrl(images, product.getImageUrl());
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .imageUrl(product.getImageUrl())
                .mainImageUrl(mainImageUrl)
                .images(imageResponses)
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .stock(product.getStock())
                .weight(product.getWeight())
                .unit(product.getUnit())
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .build();
    }

    private String resolveMainImageUrl(List<ProductImage> images, String legacyImageUrl) {
        if (images == null || images.isEmpty()) {
            return legacyImageUrl;
        }
        return images.stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsMain()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElseGet(() -> images.get(0).getImageUrl());
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
