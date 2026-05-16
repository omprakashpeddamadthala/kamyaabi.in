package com.kamyaabi.repository;

import com.kamyaabi.entity.BlogPost;
import com.kamyaabi.entity.BlogPost.BlogPostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    Optional<BlogPost> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("SELECT p FROM BlogPost p LEFT JOIN FETCH p.categories LEFT JOIN FETCH p.tags LEFT JOIN FETCH p.author WHERE p.slug = :slug")
    Optional<BlogPost> findBySlugWithRelations(@Param("slug") String slug);

    @Query("SELECT p FROM BlogPost p WHERE p.status = :status ORDER BY p.publishedAt DESC")
    Page<BlogPost> findByStatus(@Param("status") BlogPostStatus status, Pageable pageable);

    @Query("SELECT p FROM BlogPost p WHERE p.status = 'PUBLISHED' ORDER BY p.publishedAt DESC")
    Page<BlogPost> findPublished(Pageable pageable);

    @Query("SELECT p FROM BlogPost p JOIN p.categories c WHERE p.status = 'PUBLISHED' AND c.slug = :categorySlug ORDER BY p.publishedAt DESC")
    Page<BlogPost> findPublishedByCategory(@Param("categorySlug") String categorySlug, Pageable pageable);

    @Query("SELECT p FROM BlogPost p JOIN p.tags t WHERE p.status = 'PUBLISHED' AND t.slug = :tagSlug ORDER BY p.publishedAt DESC")
    Page<BlogPost> findPublishedByTag(@Param("tagSlug") String tagSlug, Pageable pageable);

    @Query("SELECT p FROM BlogPost p WHERE p.status = 'PUBLISHED' AND p.isFeatured = true ORDER BY p.publishedAt DESC")
    Page<BlogPost> findPublishedFeatured(Pageable pageable);

    @Query("SELECT p FROM BlogPost p WHERE p.status = 'PUBLISHED' AND " +
            "(LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.excerpt) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "ORDER BY p.publishedAt DESC")
    Page<BlogPost> searchPublished(@Param("q") String q, Pageable pageable);

    @Query("SELECT p FROM BlogPost p WHERE p.status = 'SCHEDULED' AND p.scheduledAt <= :now")
    List<BlogPost> findScheduledPostsDue(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE BlogPost p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT p FROM BlogPost p JOIN p.categories c WHERE p.status = 'PUBLISHED' AND p.id <> :postId AND c.id IN :categoryIds ORDER BY p.publishedAt DESC")
    Page<BlogPost> findRelatedPosts(@Param("postId") Long postId, @Param("categoryIds") List<Long> categoryIds, Pageable pageable);

    @Query("SELECT p FROM BlogPost p WHERE p.status = 'PUBLISHED' ORDER BY p.publishedAt DESC")
    List<BlogPost> findAllPublished();

    @Query("SELECT p FROM BlogPost p WHERE " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:q IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<BlogPost> findAllAdmin(@Param("status") BlogPostStatus status, @Param("q") String q, Pageable pageable);
}
