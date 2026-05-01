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
    private String slug;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private String imageUrl;
    private String mainImageUrl;
    private List<ProductImageResponse> images;
    private Long categoryId;
    private String categoryName;
    private Integer stock;
    private String weight;
    private String unit;
    private String shelfLife;
    private java.util.Map<String, String> nutritionalInfo;
    private List<String> howToUse;
    private List<String> storageTips;
    private Boolean active;
    private LocalDateTime createdAt;
}
