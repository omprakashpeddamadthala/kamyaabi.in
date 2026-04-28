package com.kamyaabi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_category_id", columnList = "category_id"),
        @Index(name = "idx_products_active", columnList = "active"),
        @Index(name = "idx_products_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountPrice;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    private String weight;

    private String unit;

    /** Optional shelf-life copy shown on the product page (e.g. "6 months"). */
    private String shelfLife;

    /**
     * Optional JSON-encoded nutritional facts: a mapping of label → value
     * (e.g. {@code {"Calories":"580 kcal","Protein":"18g"}}). Null when the
     * product has no nutritional data — the UI hides the section in that case.
     */
    @Column(columnDefinition = "TEXT")
    private String nutritionalInfoJson;

    /** Optional JSON-encoded list of "How to Use" bullet points. */
    @Column(columnDefinition = "TEXT")
    private String howToUseJson;

    /** Optional JSON-encoded list of "Storage Tips" bullet points. */
    @Column(columnDefinition = "TEXT")
    private String storageTipsJson;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * Cloudinary-hosted images for this product. The collection is owned by the
     * product side of the relationship — deleting a product cascades to its
     * images (the remote Cloudinary assets are removed by the service layer
     * before the entity is deleted).
     */
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    /**
     * Convenience accessor — attaches the image to this product and adds it to
     * the collection, keeping both sides of the relationship in sync.
     */
    public void addImage(ProductImage image) {
        image.setProduct(this);
        this.images.add(image);
    }

    public void removeImage(ProductImage image) {
        this.images.remove(image);
        image.setProduct(null);
    }
}
