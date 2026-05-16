package com.kamyaabi.service;

import com.kamyaabi.dto.request.BlogCategoryRequest;
import com.kamyaabi.dto.request.BlogPostRequest;
import com.kamyaabi.dto.request.BlogTagRequest;
import com.kamyaabi.dto.response.BlogCategoryResponse;
import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.BlogTagResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BlogService {

    // Public post operations
    Page<BlogPostResponse> getPublishedPosts(Pageable pageable);
    Page<BlogPostResponse> getPublishedPostsByCategory(String categorySlug, Pageable pageable);
    Page<BlogPostResponse> getPublishedPostsByTag(String tagSlug, Pageable pageable);
    Page<BlogPostResponse> getPublishedFeaturedPosts(Pageable pageable);
    Page<BlogPostResponse> searchPublishedPosts(String query, Pageable pageable);
    BlogPostResponse getPublishedPostBySlug(String slug);
    List<BlogPostResponse> getRelatedPosts(Long postId, int limit);
    void incrementViewCount(Long postId);
    List<BlogPostResponse> getAllPublishedPosts();

    // Admin post operations
    Page<BlogPostResponse> getAdminPosts(String status, String query, Pageable pageable);
    BlogPostResponse getAdminPostById(Long id);
    BlogPostResponse createPost(BlogPostRequest request, Long authorId);
    BlogPostResponse updatePost(Long id, BlogPostRequest request);
    void deletePost(Long id);
    BlogPostResponse publishPost(Long id);
    BlogPostResponse unpublishPost(Long id);

    // Category operations
    List<BlogCategoryResponse> getAllCategories();
    BlogCategoryResponse getCategoryBySlug(String slug);
    BlogCategoryResponse createCategory(BlogCategoryRequest request);
    BlogCategoryResponse updateCategory(Long id, BlogCategoryRequest request);
    void deleteCategory(Long id);

    // Tag operations
    List<BlogTagResponse> getAllTags();
    BlogTagResponse getTagBySlug(String slug);
    BlogTagResponse createTag(BlogTagRequest request);
    BlogTagResponse updateTag(Long id, BlogTagRequest request);
    void deleteTag(Long id);

    // Scheduled publishing
    void publishScheduledPosts();
}
