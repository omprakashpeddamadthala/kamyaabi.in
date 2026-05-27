package com.kamyaabi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "coupon_usages", indexes = {
        @Index(name = "idx_coupon_usages_coupon_id", columnList = "coupon_id"),
        @Index(name = "idx_coupon_usages_user_id", columnList = "user_id"),
        @Index(name = "idx_coupon_usages_coupon_user", columnList = "coupon_id, user_id"),
        @Index(name = "idx_coupon_usages_coupon_user_date", columnList = "coupon_id, user_id, used_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime usedAt = LocalDateTime.now();
}
