package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;
    /** Legacy single-image URL field, retained for backward compatibility with seed data and older clients. */
    private String imageUrl;
    /** Resolved URL of the main product image: main-flagged image, else first image, else {@code imageUrl}. */
    private String mainImageUrl;
    /** All images associated with the product, ordered by {@code displayOrder}. */
    private List<ProductImageResponse> images;
    private Long categoryId;
    private String categoryName;
    private Integer stock;
    private String weight;
    private String unit;
    /** Optional shelf-life copy. {@code null} when not configured. */
    private String shelfLife;
    /** Optional ordered map of nutritional label → value. {@code null} when not configured. */
    private java.util.Map<String, String> nutritionalInfo;
    /** Optional list of "how to use" bullets. {@code null} when not configured. */
    private List<String> howToUse;
    /** Optional list of "storage tips" bullets. {@code null} when not configured. */
    private List<String> storageTips;
    private Boolean active;
    private LocalDateTime createdAt;
}
