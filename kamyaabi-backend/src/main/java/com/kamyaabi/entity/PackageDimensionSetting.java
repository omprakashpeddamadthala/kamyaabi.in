package com.kamyaabi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "package_dimension_settings", indexes = {
        @Index(name = "idx_package_dimension_settings_active", columnList = "active"),
        @Index(name = "idx_package_dimension_settings_weight", columnList = "packageWeightGram")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageDimensionSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_weight_gram", nullable = false, unique = true)
    private Integer packageWeightGram;

    @Column(nullable = false)
    private Integer length;

    @Column(nullable = false)
    private Integer breadth;

    @Column(nullable = false)
    private Integer height;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
