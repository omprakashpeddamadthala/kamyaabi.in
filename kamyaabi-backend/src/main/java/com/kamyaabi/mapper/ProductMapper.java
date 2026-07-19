package com.kamyaabi.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.kamyaabi.dto.request.ProductRequest;
import com.kamyaabi.dto.response.ProductImageResponse;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.dto.response.ProductTagResponse;
import com.kamyaabi.dto.response.ProductVariationResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.ProductImage;
import com.kamyaabi.util.JsonFieldConverter;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class ProductMapper {

    private static final TypeReference<LinkedHashMap<String, String>> MAP_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<String>> LIST_TYPE = new TypeReference<>() {};

    private final ProductImageMapper productImageMapper;
    private final JsonFieldConverter jsonFieldConverter;

    public ProductMapper(ProductImageMapper productImageMapper, JsonFieldConverter jsonFieldConverter) {
        this.productImageMapper = productImageMapper;
        this.jsonFieldConverter = jsonFieldConverter;
    }

    public ProductResponse toResponse(Product product) {
        return toResponse(product, null);
    }

    public ProductResponse toResponse(Product product, List<Product> variations) {
        List<ProductImage> images = product.getImages() == null
                ? Collections.emptyList()
                : product.getImages();
        List<ProductImageResponse> imageResponses = images.stream()
                .map(productImageMapper::toResponse)
                .toList();
        List<ProductTagResponse> tagResponses = product.getTags() != null
                ? product.getTags().stream()
                    .map(t -> ProductTagResponse.builder()
                            .id(t.getId())
                            .name(t.getName())
                            .slug(t.getSlug())
                            .createdAt(t.getCreatedAt())
                            .build())
                    .toList()
                : Collections.emptyList();

        List<ProductVariationResponse> variationResponses = null;
        int variationCount = 0;
        if (variations != null && !variations.isEmpty()) {
            variationCount = variations.size();
            variationResponses = variations.stream()
                    .map(this::toVariationResponse)
                    .toList();
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .imageUrl(product.getImageUrl())
                .mainImageUrl(product.getMainImageUrl())
                .images(imageResponses)
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .categorySlug(product.getCategory().getSlug())
                .tags(tagResponses)
                .stock(product.getStock())
                .weight(product.getWeight())
                .unit(product.getUnit())
                .shelfLife(product.getShelfLife())
                .nutritionalInfo(readMap(product.getNutritionalInfoJson()))
                .howToUse(readList(product.getHowToUseJson()))
                .storageTips(readList(product.getStorageTipsJson()))
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .seoTitle(product.getSeoTitle())
                .seoDescription(product.getSeoDescription())
                .seoKeywords(product.getSeoKeywords())
                .ogImageUrl(product.getOgImageUrl())
                .canonicalUrl(product.getCanonicalUrl())
                .variations(variationResponses)
                .variationCount(variationCount)
                .build();
    }

    public ProductVariationResponse toVariationResponse(Product product) {
        return ProductVariationResponse.builder()
                .id(product.getId())
                .slug(product.getSlug())
                .weight(product.getWeight())
                .unit(product.getUnit())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .stock(product.getStock())
                .mainImageUrl(product.getMainImageUrl())
                .build();
    }

    private Map<String, String> readMap(String json) {
        return jsonFieldConverter.read(json, MAP_TYPE);
    }

    private List<String> readList(String json) {
        return jsonFieldConverter.read(json, LIST_TYPE);
    }

    private String writeJson(Object value) {
        return jsonFieldConverter.write(value);
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
                .seoTitle(request.seoTitle())
                .seoDescription(request.seoDescription())
                .seoKeywords(request.seoKeywords())
                .ogImageUrl(request.ogImageUrl())
                .canonicalUrl(request.canonicalUrl())
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
        product.setSeoTitle(request.seoTitle());
        product.setSeoDescription(request.seoDescription());
        product.setSeoKeywords(request.seoKeywords());
        product.setOgImageUrl(request.ogImageUrl());
        product.setCanonicalUrl(request.canonicalUrl());
    }
}
