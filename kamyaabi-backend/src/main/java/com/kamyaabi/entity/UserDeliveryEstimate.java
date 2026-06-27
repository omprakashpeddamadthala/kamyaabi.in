package com.kamyaabi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_delivery_estimates", indexes = {
        @Index(name = "idx_ude_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDeliveryEstimate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String pincode;

    private Boolean serviceable;

    private String city;

    private String state;

    private Integer estimatedDays;

    private String courierName;

    private String codAvailable;

    @Column(columnDefinition = "TEXT")
    private String message;

    private LocalDateTime lastRefreshedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
