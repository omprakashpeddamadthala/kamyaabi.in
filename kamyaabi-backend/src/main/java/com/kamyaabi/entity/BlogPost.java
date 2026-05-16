package com.kamyaabi.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "blog_posts", indexes = {
        @Index(name = "idx_blog_posts_slug", columnList = "slug", unique = true),
        @Index(name = "idx_blog_posts_status", columnList = "status"),
        @Index(name = "idx_blog_posts_published_at", columnList = "published_at"),
        @Index(name = "idx_blog_posts_author_id", columnList = "author_id"),
        @Index(name = "idx_blog_posts_is_featured", columnList = "is_featured")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, unique = true, length = 500)
    private String slug;

    @Column(length = 300)
    private String excerpt;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 1000)
    private String coverImageUrl;

    @Column(length = 500)
    private String coverImageAlt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BlogPostStatus status = BlogPostStatus.DRAFT;

    private LocalDateTime publishedAt;

    private LocalDateTime scheduledAt;

    @Column(length = 200)
    private String seoTitle;

    @Column(length = 300)
    private String seoDescription;

    @Column(length = 500)
    private String seoKeywords;

    @Column(length = 1000)
    private String ogImageUrl;

    @Column(length = 1000)
    private String canonicalUrl;

    @Builder.Default
    private Integer readingTimeMinutes = 1;

    @Builder.Default
    private Integer viewCount = 0;

    @Builder.Default
    private Boolean isFeatured = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "blog_post_categories",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<BlogCategory> categories = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "blog_post_tags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<BlogTag> tags = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum BlogPostStatus {
        DRAFT, PUBLISHED, SCHEDULED
    }
}
