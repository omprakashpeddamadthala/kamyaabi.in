package com.kamyaabi.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductImageResponse;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.ProductImage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ProductMapper {

    private static final TypeReference<LinkedHashMap<String, String>> MAP_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<String>> LIST_TYPE = new TypeReference<>() {};

    private final ProductImageMapper productImageMapper;
    private final ObjectMapper objectMapper;

    public ProductMapper(ProductImageMapper productImageMapper, ObjectMapper objectMapper) {
        this.productImageMapper = productImageMapper;
        this.objectMapper = objectMapper;
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
                .slug(product.getSlug())
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
                .shelfLife(product.getShelfLife())
                .nutritionalInfo(readMap(product.getNutritionalInfoJson()))
                .howToUse(readList(product.getHowToUseJson()))
                .storageTips(readList(product.getStorageTipsJson()))
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .build();
    }

    private Map<String, String> readMap(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (Exception e) {
            log.warn("Failed to parse JSON map field, returning null: {}", e.getMessage());
            return null;
        }
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, LIST_TYPE);
        } catch (Exception e) {
            log.warn("Failed to parse JSON list field, returning null: {}", e.getMessage());
            return null;
        }
    }

    private String writeJson(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Map<?, ?> m && m.isEmpty()) {
            return null;
        }
        if (value instanceof List<?> l && l.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            log.warn("Failed to serialize JSON field, storing null: {}", e.getMessage());
            return null;
        }
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
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .discountPrice(request.discountPrice())
                .imageUrl(request.imageUrl())
                .category(category)
                .stock(request.stock())
                .weight(request.weight())
                .unit(request.unit())
                .shelfLife(request.shelfLife())
                .nutritionalInfoJson(writeJson(request.nutritionalInfo()))
                .howToUseJson(writeJson(request.howToUse()))
                .storageTipsJson(writeJson(request.storageTips()))
                .active(request.active() != null ? request.active() : true)
                .build();
    }

    public void updateEntity(Product product, ProductRequest request, Category category) {
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setDiscountPrice(request.discountPrice());
        product.setImageUrl(request.imageUrl());
        product.setCategory(category);
        product.setStock(request.stock());
        product.setWeight(request.weight());
        product.setUnit(request.unit());
        product.setShelfLife(request.shelfLife());
        product.setNutritionalInfoJson(writeJson(request.nutritionalInfo()));
        product.setHowToUseJson(writeJson(request.howToUse()));
        product.setStorageTipsJson(writeJson(request.storageTips()));
        if (request.active() != null) {
            product.setActive(request.active());
        }
    }
}
