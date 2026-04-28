package com.kamyaabi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    private BigDecimal discountPrice;

    private String imageUrl;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotNull(message = "Stock is required")
    @Positive(message = "Stock must be positive")
    private Integer stock;

    private String weight;

    private String unit;

    /** Optional shelf-life copy (e.g. "6 months from packaging"). */
    private String shelfLife;

    /** Optional ordered map of nutritional label → value. */
    private java.util.Map<String, String> nutritionalInfo;

    /** Optional list of "how to use" bullets. */
    private java.util.List<String> howToUse;

    /** Optional list of "storage tips" bullets. */
    private java.util.List<String> storageTips;

    private Boolean active;
}
