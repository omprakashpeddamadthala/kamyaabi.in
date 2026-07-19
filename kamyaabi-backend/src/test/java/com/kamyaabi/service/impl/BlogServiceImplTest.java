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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlogServiceImplTest {

    @Mock private BlogPostRepository postRepository;
    @Mock private BlogCategoryRepository categoryRepository;
    @Mock private BlogTagRepository tagRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private BlogServiceImpl blogService;

    private User author;
    private BlogPost post;
    private BlogCategory category;
    private BlogTag tag;

    @BeforeEach
    void setUp() {
        author = User.builder().id(1L).name("Admin").email("admin@kamyaabi.in").build();
        category = BlogCategory.builder().id(1L).name("Health").slug("health").build();
        tag = BlogTag.builder().id(1L).name("Organic").slug("organic").build();
        post = BlogPost.builder()
                .id(1L)
                .title("Test Post")
                .slug("test-post")
                .excerpt("A test post excerpt")
                .content("<p>Hello world content here for testing reading time.</p>")
                .status(BlogPostStatus.PUBLISHED)
                .author(author)
                .publishedAt(LocalDateTime.now())
                .viewCount(0)
                .isFeatured(false)
                .readingTimeMinutes(1)
                .build();
        post.setCategories(new HashSet<>(Set.of(category)));
        post.setTags(new HashSet<>(Set.of(tag)));
    }

    // ── Public post operations ──────────────────────────────────

    @Test
    void getPublishedPosts_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findPublished(pageable)).thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.getPublishedPosts(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).title()).isEqualTo("Test Post");
    }

    @Test
    void getPublishedPostsByCategory_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findPublishedByCategory("health", pageable))
                .thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.getPublishedPostsByCategory("health", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getPublishedPostsByTag_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findPublishedByTag("organic", pageable))
                .thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.getPublishedPostsByTag("organic", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getPublishedFeaturedPosts_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findPublishedFeatured(pageable))
                .thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.getPublishedFeaturedPosts(pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void searchPublishedPosts_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.searchPublished("test", pageable))
                .thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.searchPublishedPosts("test", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getPublishedPostBySlug_shouldReturnPost() {
        when(postRepository.findBySlugWithRelations("test-post")).thenReturn(Optional.of(post));

        BlogPostResponse result = blogService.getPublishedPostBySlug("test-post");

        assertThat(result.title()).isEqualTo("Test Post");
        assertThat(result.slug()).isEqualTo("test-post");
    }

    @Test
    void getPublishedPostBySlug_notFound_shouldThrow() {
        when(postRepository.findBySlugWithRelations("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.getPublishedPostBySlug("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPublishedPostBySlug_draftPost_shouldThrow() {
        post.setStatus(BlogPostStatus.DRAFT);
        when(postRepository.findBySlugWithRelations("test-post")).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> blogService.getPublishedPostBySlug("test-post"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getRelatedPosts_shouldReturnList() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.findRelatedPosts(eq(1L), any(), any()))
                .thenReturn(new PageImpl<>(List.of(post)));

        List<BlogPostResponse> result = blogService.getRelatedPosts(1L, 3);

        assertThat(result).hasSize(1);
    }

    @Test
    void getRelatedPosts_noCategories_shouldReturnEmpty() {
        post.setCategories(new HashSet<>());
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        List<BlogPostResponse> result = blogService.getRelatedPosts(1L, 3);

        assertThat(result).isEmpty();
    }

    @Test
    void getRelatedPosts_notFound_shouldThrow() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.getRelatedPosts(999L, 3))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void incrementViewCount_shouldCallRepository() {
        blogService.incrementViewCount(1L);

        verify(postRepository).incrementViewCount(1L);
    }

    @Test
    void getAllPublishedPosts_shouldReturnList() {
        when(postRepository.findAllPublished()).thenReturn(List.of(post));

        List<BlogPostResponse> result = blogService.getAllPublishedPosts();

        assertThat(result).hasSize(1);
    }

    // ── Admin post operations ───────────────────────────────────

    @Test
    void getAdminPosts_withValidStatus_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findAllAdmin(BlogPostStatus.PUBLISHED, null, pageable))
                .thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.getAdminPosts("PUBLISHED", null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getAdminPosts_withInvalidStatus_shouldIgnore() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findAllAdmin(null, null, pageable))
                .thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.getAdminPosts("INVALID", null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getAdminPosts_withQuery_shouldPass() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findAllAdmin(null, "test", pageable))
                .thenReturn(new PageImpl<>(List.of(post)));

        Page<BlogPostResponse> result = blogService.getAdminPosts(null, "test", pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getAdminPosts_withBlankStatusAndQuery_shouldPassNull() {
        Pageable pageable = PageRequest.of(0, 10);
        when(postRepository.findAllAdmin(null, null, pageable))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<BlogPostResponse> result = blogService.getAdminPosts("  ", "  ", pageable);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void getAdminPostById_shouldReturnPost() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        BlogPostResponse result = blogService.getAdminPostById(1L);

        assertThat(result.title()).isEqualTo("Test Post");
    }

    @Test
    void getAdminPostById_notFound_shouldThrow() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.getAdminPostById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createPost_asDraft_shouldSucceed() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("New Post")
                .content("<p>Some content</p>")
                .status("DRAFT")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("new-post")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(2L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result.title()).isEqualTo("New Post");
        assertThat(result.slug()).isEqualTo("new-post");
    }

    @Test
    void createPost_asPublished_shouldSetPublishedAt() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Published Post")
                .content("<p>Content</p>")
                .status("PUBLISHED")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("published-post")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(3L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result.status()).isEqualTo("PUBLISHED");
        assertThat(result.publishedAt()).isNotNull();
    }

    @Test
    void createPost_asScheduled_shouldSetScheduledAt() {
        LocalDateTime future = LocalDateTime.now().plusDays(1);
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Scheduled Post")
                .content("<p>Content</p>")
                .status("SCHEDULED")
                .scheduledAt(future)
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("scheduled-post")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(4L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result.status()).isEqualTo("SCHEDULED");
        assertThat(result.scheduledAt()).isEqualTo(future);
    }

    @Test
    void createPost_scheduledWithoutDate_shouldThrow() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Bad Scheduled")
                .content("<p>Content</p>")
                .status("SCHEDULED")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("bad-scheduled")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.createPost(request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("scheduledAt");
    }

    @Test
    void createPost_withCategoriesAndTags_shouldApply() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Tagged Post")
                .content("<p>Content</p>")
                .status("DRAFT")
                .categoryIds(Set.of(1L))
                .tagIds(Set.of(1L))
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("tagged-post")).thenReturn(Optional.empty());
        when(categoryRepository.findAllById(Set.of(1L))).thenReturn(List.of(category));
        when(tagRepository.findByIdIn(Set.of(1L))).thenReturn(Set.of(tag));
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(5L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.tags()).hasSize(1);
    }

    @Test
    void createPost_authorNotFound_shouldThrow() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("No Author")
                .content("<p>Content</p>")
                .build();
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.createPost(request, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createPost_slugCollision_shouldAppendSuffix() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Test Post")
                .content("<p>Content</p>")
                .status("DRAFT")
                .build();
        BlogPost existing = BlogPost.builder().id(99L).slug("test-post").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("test-post")).thenReturn(Optional.of(existing));
        when(postRepository.findBySlug("test-post-1")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(6L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result.slug()).isEqualTo("test-post-1");
    }

    @Test
    void updatePost_shouldUpdateFields() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Updated Title")
                .content("<p>Updated content</p>")
                .excerpt("Updated excerpt")
                .status("DRAFT")
                .build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.findBySlug("updated-title")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogPostResponse result = blogService.updatePost(1L, request);

        assertThat(result.title()).isEqualTo("Updated Title");
    }

    @Test
    void updatePost_notFound_shouldThrow() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("X").content("X").build();
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.updatePost(999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deletePost_shouldDelete() {
        when(postRepository.existsById(1L)).thenReturn(true);

        blogService.deletePost(1L);

        verify(postRepository).deleteById(1L);
    }

    @Test
    void deletePost_notFound_shouldThrow() {
        when(postRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> blogService.deletePost(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void publishPost_shouldSetStatusAndDate() {
        post.setStatus(BlogPostStatus.DRAFT);
        post.setPublishedAt(null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogPostResponse result = blogService.publishPost(1L);

        assertThat(result.status()).isEqualTo("PUBLISHED");
        assertThat(result.publishedAt()).isNotNull();
    }

    @Test
    void publishPost_notFound_shouldThrow() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.publishPost(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void unpublishPost_shouldRevertToDraft() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogPostResponse result = blogService.unpublishPost(1L);

        assertThat(result.status()).isEqualTo("DRAFT");
    }

    @Test
    void unpublishPost_notFound_shouldThrow() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.unpublishPost(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Category operations ─────────────────────────────────────

    @Test
    void getAllCategories_shouldReturnList() {
        when(categoryRepository.findAll()).thenReturn(List.of(category));

        List<BlogCategoryResponse> result = blogService.getAllCategories();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Health");
    }

    @Test
    void getCategoryBySlug_shouldReturnCategory() {
        when(categoryRepository.findBySlug("health")).thenReturn(Optional.of(category));

        BlogCategoryResponse result = blogService.getCategoryBySlug("health");

        assertThat(result.name()).isEqualTo("Health");
    }

    @Test
    void getCategoryBySlug_notFound_shouldThrow() {
        when(categoryRepository.findBySlug("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.getCategoryBySlug("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createCategory_shouldSucceed() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Nutrition").build();
        when(categoryRepository.existsByName("Nutrition")).thenReturn(false);
        when(categoryRepository.existsBySlug("nutrition")).thenReturn(false);
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(inv -> {
            BlogCategory c = inv.getArgument(0);
            c.setId(2L);
            return c;
        });

        BlogCategoryResponse result = blogService.createCategory(request);

        assertThat(result.name()).isEqualTo("Nutrition");
    }

    @Test
    void createCategory_withParent_shouldSucceed() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Sub Category").parentId(1L).build();
        when(categoryRepository.existsByName("Sub Category")).thenReturn(false);
        when(categoryRepository.existsBySlug("sub-category")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(inv -> {
            BlogCategory c = inv.getArgument(0);
            c.setId(3L);
            return c;
        });

        BlogCategoryResponse result = blogService.createCategory(request);

        assertThat(result.name()).isEqualTo("Sub Category");
    }

    @Test
    void createCategory_parentNotFound_shouldThrow() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Sub").parentId(999L).build();
        when(categoryRepository.existsByName("Sub")).thenReturn(false);
        when(categoryRepository.existsBySlug("sub")).thenReturn(false);

        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.createCategory(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createCategory_duplicateName_shouldThrow() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Health").build();
        when(categoryRepository.existsByName("Health")).thenReturn(true);

        assertThatThrownBy(() -> blogService.createCategory(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createCategory_duplicateSlug_shouldThrow() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Health2").build();
        when(categoryRepository.existsByName("Health2")).thenReturn(false);
        when(categoryRepository.existsBySlug("health2")).thenReturn(true);

        assertThatThrownBy(() -> blogService.createCategory(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createCategory_withCustomSlug_shouldUseIt() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Nutrition").slug("custom-slug").build();
        when(categoryRepository.existsByName("Nutrition")).thenReturn(false);
        when(categoryRepository.existsBySlug("custom-slug")).thenReturn(false);
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(inv -> {
            BlogCategory c = inv.getArgument(0);
            c.setId(4L);
            return c;
        });

        BlogCategoryResponse result = blogService.createCategory(request);

        assertThat(result.slug()).isEqualTo("custom-slug");
    }

    @Test
    void updateCategory_shouldUpdateFields() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Updated").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogCategoryResponse result = blogService.updateCategory(1L, request);

        assertThat(result.name()).isEqualTo("Updated");
    }

    @Test
    void updateCategory_withParent_shouldAttach() {
        BlogCategory parent = BlogCategory.builder().id(2L).name("Parent").slug("parent").build();
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Child").parentId(2L).build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(parent));
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogCategoryResponse result = blogService.updateCategory(1L, request);

        assertThat(result.parentId()).isEqualTo(2L);
    }

    @Test
    void updateCategory_selfParent_shouldThrow() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Health").parentId(1L).build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        assertThatThrownBy(() -> blogService.updateCategory(1L, request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateCategory_parentNotFound_shouldThrow() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Health").parentId(999L).build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.updateCategory(1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateCategory_removeParent_shouldSetNull() {
        category.setParent(BlogCategory.builder().id(2L).name("P").build());
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Health").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogCategoryResponse result = blogService.updateCategory(1L, request);

        assertThat(result.parentId()).isNull();
    }

    @Test
    void updateCategory_notFound_shouldThrow() {
        BlogCategoryRequest request = BlogCategoryRequest.builder().name("X").build();
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.updateCategory(999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteCategory_shouldDelete() {
        when(categoryRepository.existsById(1L)).thenReturn(true);

        blogService.deleteCategory(1L);

        verify(categoryRepository).deleteById(1L);
    }

    @Test
    void deleteCategory_notFound_shouldThrow() {
        when(categoryRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> blogService.deleteCategory(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Tag operations ──────────────────────────────────────────

    @Test
    void getAllTags_shouldReturnList() {
        when(tagRepository.findAll()).thenReturn(List.of(tag));

        List<BlogTagResponse> result = blogService.getAllTags();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Organic");
    }

    @Test
    void getTagBySlug_shouldReturnTag() {
        when(tagRepository.findBySlug("organic")).thenReturn(Optional.of(tag));

        BlogTagResponse result = blogService.getTagBySlug("organic");

        assertThat(result.name()).isEqualTo("Organic");
    }

    @Test
    void getTagBySlug_notFound_shouldThrow() {
        when(tagRepository.findBySlug("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.getTagBySlug("missing"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createTag_shouldSucceed() {
        BlogTagRequest request = BlogTagRequest.builder().name("Vegan").build();
        when(tagRepository.existsByName("Vegan")).thenReturn(false);
        when(tagRepository.existsBySlug("vegan")).thenReturn(false);
        when(tagRepository.save(any(BlogTag.class))).thenAnswer(inv -> {
            BlogTag t = inv.getArgument(0);
            t.setId(2L);
            return t;
        });

        BlogTagResponse result = blogService.createTag(request);

        assertThat(result.name()).isEqualTo("Vegan");
    }

    @Test
    void createTag_duplicateName_shouldThrow() {
        BlogTagRequest request = BlogTagRequest.builder().name("Organic").build();
        when(tagRepository.existsByName("Organic")).thenReturn(true);

        assertThatThrownBy(() -> blogService.createTag(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createTag_duplicateSlug_shouldThrow() {
        BlogTagRequest request = BlogTagRequest.builder().name("Organic2").build();
        when(tagRepository.existsByName("Organic2")).thenReturn(false);
        when(tagRepository.existsBySlug("organic2")).thenReturn(true);

        assertThatThrownBy(() -> blogService.createTag(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createTag_withCustomSlug_shouldUseIt() {
        BlogTagRequest request = BlogTagRequest.builder()
                .name("Vegan").slug("custom-tag").build();
        when(tagRepository.existsByName("Vegan")).thenReturn(false);
        when(tagRepository.existsBySlug("custom-tag")).thenReturn(false);
        when(tagRepository.save(any(BlogTag.class))).thenAnswer(inv -> {
            BlogTag t = inv.getArgument(0);
            t.setId(3L);
            return t;
        });

        BlogTagResponse result = blogService.createTag(request);

        assertThat(result.slug()).isEqualTo("custom-tag");
    }

    @Test
    void updateTag_shouldUpdateFields() {
        BlogTagRequest request = BlogTagRequest.builder().name("Updated Tag").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(any(BlogTag.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogTagResponse result = blogService.updateTag(1L, request);

        assertThat(result.name()).isEqualTo("Updated Tag");
    }

    @Test
    void updateTag_withCustomSlug_shouldUseIt() {
        BlogTagRequest request = BlogTagRequest.builder()
                .name("Updated").slug("updated-slug").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(any(BlogTag.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogTagResponse result = blogService.updateTag(1L, request);

        assertThat(result.slug()).isEqualTo("updated-slug");
    }

    @Test
    void updateTag_notFound_shouldThrow() {
        BlogTagRequest request = BlogTagRequest.builder().name("X").build();
        when(tagRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> blogService.updateTag(999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTag_shouldDelete() {
        when(tagRepository.existsById(1L)).thenReturn(true);

        blogService.deleteTag(1L);

        verify(tagRepository).deleteById(1L);
    }

    @Test
    void deleteTag_notFound_shouldThrow() {
        when(tagRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> blogService.deleteTag(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Scheduled publishing ────────────────────────────────────

    @Test
    void publishScheduledPosts_shouldPublishDuePosts() {
        BlogPost scheduledPost = BlogPost.builder()
                .id(10L)
                .title("Scheduled")
                .slug("scheduled")
                .status(BlogPostStatus.SCHEDULED)
                .scheduledAt(LocalDateTime.now().minusMinutes(10))
                .build();
        scheduledPost.setCategories(new HashSet<>());
        scheduledPost.setTags(new HashSet<>());
        when(postRepository.findScheduledPostsDue(any(LocalDateTime.class)))
                .thenReturn(List.of(scheduledPost));
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));

        blogService.publishScheduledPosts();

        assertThat(scheduledPost.getStatus()).isEqualTo(BlogPostStatus.PUBLISHED);
        assertThat(scheduledPost.getPublishedAt()).isEqualTo(scheduledPost.getScheduledAt());
        verify(postRepository).save(scheduledPost);
    }

    @Test
    void publishScheduledPosts_noDuePosts_shouldDoNothing() {
        when(postRepository.findScheduledPostsDue(any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        blogService.publishScheduledPosts();

        verify(postRepository, never()).save(any());
    }

    // ── toPostResponse edge cases ───────────────────────────────

    @Test
    void toPostResponse_nullAuthor_shouldHandleGracefully() {
        post.setAuthor(null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        BlogPostResponse result = blogService.getAdminPostById(1L);

        assertThat(result.authorId()).isNull();
        assertThat(result.authorName()).isNull();
    }

    @Test
    void toPostResponse_nullCategoriesAndTags_shouldReturnEmptyLists() {
        post.setCategories(null);
        post.setTags(null);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        BlogPostResponse result = blogService.getAdminPostById(1L);

        assertThat(result.categories()).isEmpty();
        assertThat(result.tags()).isEmpty();
    }

    @Test
    void createPost_withNullStatus_shouldDefaultToDraft() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("No Status")
                .content("<p>Content</p>")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("no-status")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(7L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result).isNotNull();
    }

    @Test
    void createPost_withNullContent_shouldSetReadingTimeToOne() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Empty Content")
                .status("DRAFT")
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("empty-content")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(8L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result.readingTimeMinutes()).isEqualTo(1);
    }

    @Test
    void updatePost_withCustomSlug_shouldUseIt() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Updated")
                .slug("my-custom-slug")
                .content("<p>C</p>")
                .status("DRAFT")
                .build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.findBySlug("my-custom-slug")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogPostResponse result = blogService.updatePost(1L, request);

        assertThat(result.slug()).isEqualTo("my-custom-slug");
    }

    @Test
    void updatePost_samePostSlug_shouldKeepIt() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Test Post")
                .content("<p>C</p>")
                .status("DRAFT")
                .build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.findBySlug("test-post")).thenReturn(Optional.of(post));
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogPostResponse result = blogService.updatePost(1L, request);

        assertThat(result.slug()).isEqualTo("test-post");
    }

    @Test
    void updateCategory_withCustomSlug_shouldUseIt() {
        BlogCategoryRequest request = BlogCategoryRequest.builder()
                .name("Health").slug("custom-cat-slug").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(BlogCategory.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogCategoryResponse result = blogService.updateCategory(1L, request);

        assertThat(result.slug()).isEqualTo("custom-cat-slug");
    }

    @Test
    void updatePost_clearCategoriesAndTags_shouldClear() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Clear All")
                .content("<p>C</p>")
                .status("DRAFT")
                .build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.findBySlug("clear-all")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> inv.getArgument(0));

        BlogPostResponse result = blogService.updatePost(1L, request);

        assertThat(result).isNotNull();
    }

    @Test
    void createPost_withFeaturedTrue_shouldSetFeatured() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Featured Post")
                .content("<p>Content</p>")
                .status("DRAFT")
                .isFeatured(true)
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(author));
        when(postRepository.findBySlug("featured-post")).thenReturn(Optional.empty());
        when(postRepository.save(any(BlogPost.class))).thenAnswer(inv -> {
            BlogPost p = inv.getArgument(0);
            p.setId(9L);
            return p;
        });

        BlogPostResponse result = blogService.createPost(request, 1L);

        assertThat(result.isFeatured()).isTrue();
    }

    @Test
    void toCategoryResponse_withParent_shouldIncludeParentInfo() {
        BlogCategory child = BlogCategory.builder()
                .id(3L).name("Child").slug("child").build();
        child.setParent(category);
        when(categoryRepository.findBySlug("child")).thenReturn(Optional.of(child));

        BlogCategoryResponse result = blogService.getCategoryBySlug("child");

        assertThat(result.parentId()).isEqualTo(1L);
        assertThat(result.parentName()).isEqualTo("Health");
    }
}
