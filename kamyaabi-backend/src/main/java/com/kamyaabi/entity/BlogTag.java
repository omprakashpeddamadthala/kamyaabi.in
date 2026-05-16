package com.kamyaabi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "blog_tags", indexes = {
        @Index(name = "idx_blog_tags_slug", columnList = "slug", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
