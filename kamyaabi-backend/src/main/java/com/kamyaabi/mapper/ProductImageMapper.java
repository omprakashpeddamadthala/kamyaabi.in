package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.ProductImageResponse;
import com.kamyaabi.entity.ProductImage;
import org.springframework.stereotype.Component;

@Component
public class ProductImageMapper {

    public ProductImageResponse toResponse(ProductImage image) {
        return ProductImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .publicId(image.getPublicId())
                .isMain(image.getIsMain())
                .displayOrder(image.getDisplayOrder())
                .build();
    }
}
