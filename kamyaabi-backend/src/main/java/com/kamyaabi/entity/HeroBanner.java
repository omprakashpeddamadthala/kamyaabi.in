package com.kamyaabi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Admin-managed homepage hero/banner image. Drives the rotating hero slider on
 * the storefront homepage. Seeded with the previously hard-coded slides so the
 * homepage looks identical until an admin customises it.
 */
@Entity
@Table(name = "hero_banners", indexes = {
        @Index(name = "idx_hero_banners_active_order", columnList = "active, display_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_url", nullable = false, length = 1024)
    private String imageUrl;

    /** Cloudinary public id; null for seeded local assets that are not Cloudinary-managed. */
    @Column(name = "public_id", length = 512)
    private String publicId;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "subtitle", length = 1024)
    private String subtitle;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(name = "link_url", length = 1024)
    private String linkUrl;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
