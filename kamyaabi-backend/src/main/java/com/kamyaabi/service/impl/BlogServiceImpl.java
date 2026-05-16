package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.BlogCategoryRequest;
import com.kamyaabi.dto.request.BlogPostRequest;
import com.kamyaabi.dto.request.BlogTagRequest;
import com.kamyaabi.dto.response.BlogCategoryResponse;
import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.BlogTagResponse;
import com.kamyaabi.entity.BlogCategory;
import com.kamyaabi.entity.BlogPost;
import com.kamyaabi.entity.BlogPost.BlogPostStatus;
import com.kamyaabi.entity.BlogTag;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.BlogCategoryRepository;
import com.kamyaabi.repository.BlogPostRepository;
import com.kamyaabi.repository.BlogTagRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.BlogService;
import com.kamyaabi.util.Slugifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class BlogServiceImpl implements BlogService {

    private final BlogPostRepository postRepository;
    private final BlogCategoryRepository categoryRepository;
    private final BlogTagRepository tagRepository;
    private final UserRepository userRepository;

    public BlogServiceImpl(BlogPostRepository postRepository,
                           BlogCategoryRepository categoryRepository,
                           BlogTagRepository tagRepository,
                           UserRepository userRepository) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
    }

    // ── Public post operations ──────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<BlogPostResponse> getPublishedPosts(Pageable pageable) {
        return postRepository.findPublished(pageable).map(this::toPostResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BlogPostResponse> getPublishedPostsByCategory(String categorySlug, Pageable pageable) {
        return postRepository.findPublishedByCategory(categorySlug, pageable).map(this::toPostResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BlogPostResponse> getPublishedPostsByTag(String tagSlug, Pageable pageable) {
        return postRepository.findPublishedByTag(tagSlug, pageable).map(this::toPostResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BlogPostResponse> getPublishedFeaturedPosts(Pageable pageable) {
        return postRepository.findPublishedFeatured(pageable).map(this::toPostResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BlogPostResponse> searchPublishedPosts(String query, Pageable pageable) {
        return postRepository.searchPublished(query, pageable).map(this::toPostResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BlogPostResponse getPublishedPostBySlug(String slug) {
        BlogPost post = postRepository.findBySlugWithRelations(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found: " + slug));
        if (post.getStatus() != BlogPostStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Blog post not found: " + slug);
        }
        return toPostResponse(post);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlogPostResponse> getRelatedPosts(Long postId, int limit) {
        BlogPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found"));
        List<Long> categoryIds = post.getCategories().stream()
                .map(BlogCategory::getId)
                .collect(Collectors.toList());
        if (categoryIds.isEmpty()) {
            return Collections.emptyList();
        }
        return postRepository.findRelatedPosts(postId, categoryIds, PageRequest.of(0, limit))
                .map(this::toPostResponse)
                .getContent();
    }

    @Override
    @Transactional
    public void incrementViewCount(Long postId) {
        postRepository.incrementViewCount(postId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlogPostResponse> getAllPublishedPosts() {
        return postRepository.findAllPublished().stream()
                .map(this::toPostResponse)
                .collect(Collectors.toList());
    }

    // ── Admin post operations ───────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<BlogPostResponse> getAdminPosts(String status, String query, Pageable pageable) {
        BlogPostStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = BlogPostStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // ignore invalid status
            }
        }
        String q = (query != null && !query.isBlank()) ? query : null;
        return postRepository.findAllAdmin(statusEnum, q, pageable).map(this::toPostResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BlogPostResponse getAdminPostById(Long id) {
        BlogPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found"));
        return toPostResponse(post);
    }

    @Override
    @Transactional
    public BlogPostResponse createPost(BlogPostRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found"));

        String slug = resolveUniqueSlug(request.slug(), request.title(), null);

        BlogPost post = BlogPost.builder()
                .title(request.title())
                .slug(slug)
                .excerpt(request.excerpt())
                .content(request.content())
                .coverImageUrl(request.coverImageUrl())
                .coverImageAlt(request.coverImageAlt())
                .author(author)
                .seoTitle(request.seoTitle())
                .seoDescription(request.seoDescription())
                .seoKeywords(request.seoKeywords())
                .ogImageUrl(request.ogImageUrl())
                .canonicalUrl(request.canonicalUrl())
                .isFeatured(request.isFeatured() != null ? request.isFeatured() : false)
                .readingTimeMinutes(calculateReadingTime(request.content()))
                .build();

        applyStatus(post, request);
        applyCategories(post, request.categoryIds());
        applyTags(post, request.tagIds());

        return toPostResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public BlogPostResponse updatePost(Long id, BlogPostRequest request) {
        BlogPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found"));

        String slug = resolveUniqueSlug(request.slug(), request.title(), post.getId());

        post.setTitle(request.title());
        post.setSlug(slug);
        post.setExcerpt(request.excerpt());
        post.setContent(request.content());
        post.setCoverImageUrl(request.coverImageUrl());
        post.setCoverImageAlt(request.coverImageAlt());
        post.setSeoTitle(request.seoTitle());
        post.setSeoDescription(request.seoDescription());
        post.setSeoKeywords(request.seoKeywords());
        post.setOgImageUrl(request.ogImageUrl());
        post.setCanonicalUrl(request.canonicalUrl());
        post.setIsFeatured(request.isFeatured() != null ? request.isFeatured() : false);
        post.setReadingTimeMinutes(calculateReadingTime(request.content()));

        applyStatus(post, request);
        applyCategories(post, request.categoryIds());
        applyTags(post, request.tagIds());

        return toPostResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public void deletePost(Long id) {
        if (!postRepository.existsById(id)) {
            throw new ResourceNotFoundException("Blog post not found");
        }
        postRepository.deleteById(id);
    }

    @Override
    @Transactional
    public BlogPostResponse publishPost(Long id) {
        BlogPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found"));
        post.setStatus(BlogPostStatus.PUBLISHED);
        post.setPublishedAt(LocalDateTime.now());
        post.setScheduledAt(null);
        return toPostResponse(postRepository.save(post));
    }

    @Override
    @Transactional
    public BlogPostResponse unpublishPost(Long id) {
        BlogPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found"));
        post.setStatus(BlogPostStatus.DRAFT);
        return toPostResponse(postRepository.save(post));
    }

    // ── Category operations ─────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<BlogCategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BlogCategoryResponse getCategoryBySlug(String slug) {
        BlogCategory category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Blog category not found: " + slug));
        return toCategoryResponse(category);
    }

    @Override
    @Transactional
    public BlogCategoryResponse createCategory(BlogCategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Blog category with this name already exists");
        }
        String slug = (request.slug() != null && !request.slug().isBlank())
                ? Slugifier.slugify(request.slug())
                : Slugifier.slugify(request.name());
        if (categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Blog category slug already exists: " + slug);
        }

        BlogCategory category = BlogCategory.builder()
                .name(request.name())
                .slug(slug)
                .description(request.description())
                .build();

        if (request.parentId() != null) {
            BlogCategory parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        }

        return toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public BlogCategoryResponse updateCategory(Long id, BlogCategoryRequest request) {
        BlogCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog category not found"));
        category.setName(request.name());
        String slug = (request.slug() != null && !request.slug().isBlank())
                ? Slugifier.slugify(request.slug())
                : Slugifier.slugify(request.name());
        category.setSlug(slug);
        category.setDescription(request.description());

        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new BadRequestException("Category cannot be its own parent");
            }
            BlogCategory parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        return toCategoryResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Blog category not found");
        }
        categoryRepository.deleteById(id);
    }

    // ── Tag operations ──────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<BlogTagResponse> getAllTags() {
        return tagRepository.findAll().stream()
                .map(this::toTagResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BlogTagResponse getTagBySlug(String slug) {
        BlogTag tag = tagRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Blog tag not found: " + slug));
        return toTagResponse(tag);
    }

    @Override
    @Transactional
    public BlogTagResponse createTag(BlogTagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Blog tag with this name already exists");
        }
        String slug = (request.slug() != null && !request.slug().isBlank())
                ? Slugifier.slugify(request.slug())
                : Slugifier.slugify(request.name());
        if (tagRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Blog tag slug already exists: " + slug);
        }
        BlogTag tag = BlogTag.builder()
                .name(request.name())
                .slug(slug)
                .description(request.description())
                .build();
        return toTagResponse(tagRepository.save(tag));
    }

    @Override
    @Transactional
    public BlogTagResponse updateTag(Long id, BlogTagRequest request) {
        BlogTag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog tag not found"));
        tag.setName(request.name());
        String slug = (request.slug() != null && !request.slug().isBlank())
                ? Slugifier.slugify(request.slug())
                : Slugifier.slugify(request.name());
        tag.setSlug(slug);
        tag.setDescription(request.description());
        return toTagResponse(tagRepository.save(tag));
    }

    @Override
    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Blog tag not found");
        }
        tagRepository.deleteById(id);
    }

    // ── Scheduled publishing ────────────────────────────────────

    @Override
    @Scheduled(fixedRate = 300_000) // every 5 minutes
    @Transactional
    public void publishScheduledPosts() {
        List<BlogPost> due = postRepository.findScheduledPostsDue(LocalDateTime.now());
        for (BlogPost post : due) {
            post.setStatus(BlogPostStatus.PUBLISHED);
            post.setPublishedAt(post.getScheduledAt());
            postRepository.save(post);
            log.info("Auto-published scheduled blog post: id={}, title={}", post.getId(), post.getTitle());
        }
    }

    // ── Helper methods ──────────────────────────────────────────

    private String resolveUniqueSlug(String requestSlug, String title, Long existingId) {
        String baseSlug = (requestSlug != null && !requestSlug.isBlank())
                ? Slugifier.slugify(requestSlug)
                : Slugifier.slugify(title);

        String slug = baseSlug;
        int suffix = 1;
        while (true) {
            BlogPost existing = postRepository.findBySlug(slug).orElse(null);
            if (existing == null || existing.getId().equals(existingId)) {
                break;
            }
            slug = baseSlug + "-" + suffix++;
        }
        return slug;
    }

    private void applyStatus(BlogPost post, BlogPostRequest request) {
        if (request.status() == null) return;
        switch (request.status().toUpperCase()) {
            case "PUBLISHED" -> {
                post.setStatus(BlogPostStatus.PUBLISHED);
                if (post.getPublishedAt() == null) {
                    post.setPublishedAt(LocalDateTime.now());
                }
                post.setScheduledAt(null);
            }
            case "SCHEDULED" -> {
                if (request.scheduledAt() == null) {
                    throw new BadRequestException("scheduledAt is required for scheduled posts");
                }
                post.setStatus(BlogPostStatus.SCHEDULED);
                post.setScheduledAt(request.scheduledAt());
            }
            default -> post.setStatus(BlogPostStatus.DRAFT);
        }
    }

    private void applyCategories(BlogPost post, Set<Long> categoryIds) {
        if (categoryIds == null) {
            post.getCategories().clear();
            return;
        }
        Set<BlogCategory> categories = new HashSet<>(categoryRepository.findAllById(categoryIds));
        post.setCategories(categories);
    }

    private void applyTags(BlogPost post, Set<Long> tagIds) {
        if (tagIds == null) {
            post.getTags().clear();
            return;
        }
        Set<BlogTag> tags = tagRepository.findByIdIn(tagIds);
        post.setTags(tags);
    }

    private int calculateReadingTime(String content) {
        if (content == null || content.isBlank()) return 1;
        String plainText = content.replaceAll("<[^>]*>", "").replaceAll("\\s+", " ").trim();
        int wordCount = plainText.split("\\s+").length;
        return Math.max(1, (int) Math.ceil(wordCount / 200.0));
    }

    private BlogPostResponse toPostResponse(BlogPost post) {
        List<BlogCategoryResponse> categories = post.getCategories() != null
                ? post.getCategories().stream().map(this::toCategoryResponse).collect(Collectors.toList())
                : Collections.emptyList();
        List<BlogTagResponse> tags = post.getTags() != null
                ? post.getTags().stream().map(this::toTagResponse).collect(Collectors.toList())
                : Collections.emptyList();
        User author = post.getAuthor();
        return BlogPostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .excerpt(post.getExcerpt())
                .content(post.getContent())
                .coverImageUrl(post.getCoverImageUrl())
                .coverImageAlt(post.getCoverImageAlt())
                .authorId(author != null ? author.getId() : null)
                .authorName(author != null ? author.getName() : null)
                .authorAvatarUrl(author != null ? author.getAvatarUrl() : null)
                .status(post.getStatus().name())
                .publishedAt(post.getPublishedAt())
                .scheduledAt(post.getScheduledAt())
                .categories(categories)
                .tags(tags)
                .seoTitle(post.getSeoTitle())
                .seoDescription(post.getSeoDescription())
                .seoKeywords(post.getSeoKeywords())
                .ogImageUrl(post.getOgImageUrl())
                .canonicalUrl(post.getCanonicalUrl())
                .readingTimeMinutes(post.getReadingTimeMinutes())
                .viewCount(post.getViewCount())
                .isFeatured(post.getIsFeatured())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private BlogCategoryResponse toCategoryResponse(BlogCategory category) {
        BlogCategory parent = category.getParent();
        return BlogCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .parentId(parent != null ? parent.getId() : null)
                .parentName(parent != null ? parent.getName() : null)
                .createdAt(category.getCreatedAt())
                .build();
    }

    private BlogTagResponse toTagResponse(BlogTag tag) {
        return BlogTagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .description(tag.getDescription())
                .createdAt(tag.getCreatedAt())
                .build();
    }
}
