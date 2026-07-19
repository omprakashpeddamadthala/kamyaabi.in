package com.kamyaabi.controller;

import com.kamyaabi.dto.response.BlogCategoryResponse;
import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.BlogTagResponse;
import com.kamyaabi.service.BlogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlogControllerTest {

    @Mock private BlogService blogService;

    @InjectMocks private BlogController blogController;

    private BlogPostResponse postResponse;
    private BlogCategoryResponse categoryResponse;
    private BlogTagResponse tagResponse;

    @BeforeEach
    void setUp() {
        postResponse = BlogPostResponse.builder()
                .id(1L).title("Test").slug("test")
                .status("PUBLISHED")
                .publishedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .categories(Collections.emptyList())
                .tags(Collections.emptyList())
                .build();
        categoryResponse = BlogCategoryResponse.builder()
                .id(1L).name("Health").slug("health").build();
        tagResponse = BlogTagResponse.builder()
                .id(1L).name("Organic").slug("organic").build();
    }

    @Test
    void getPosts_default_shouldReturn200() {
        when(blogService.getPublishedPosts(any())).thenReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<?> response = blogController.getPosts(0, 10, null, null, null, null, "createdAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getPosts_withSearch_shouldCallSearch() {
        when(blogService.searchPublishedPosts(eq("test"), any()))
                .thenReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<?> response = blogController.getPosts(0, 10, null, null, "test", null, "createdAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getPosts_withCategory_shouldCallCategoryFilter() {
        when(blogService.getPublishedPostsByCategory(eq("health"), any()))
                .thenReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<?> response = blogController.getPosts(0, 10, "health", null, null, null, "createdAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getPosts_withTag_shouldCallTagFilter() {
        when(blogService.getPublishedPostsByTag(eq("organic"), any()))
                .thenReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<?> response = blogController.getPosts(0, 10, null, "organic", null, null, "createdAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getPosts_withFeatured_shouldCallFeaturedFilter() {
        when(blogService.getPublishedFeaturedPosts(any()))
                .thenReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<?> response = blogController.getPosts(0, 10, null, null, null, true, "createdAt,desc");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getPostBySlug_shouldReturn200() {
        when(blogService.getPublishedPostBySlug("test")).thenReturn(postResponse);

        ResponseEntity<?> response = blogController.getPostBySlug("test");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void incrementViewCount_shouldReturn200() {
        ResponseEntity<?> response = blogController.incrementViewCount(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(blogService).incrementViewCount(1L);
    }

    @Test
    void getRelatedPosts_shouldReturn200() {
        when(blogService.getRelatedPosts(1L, 3)).thenReturn(List.of(postResponse));

        ResponseEntity<?> response = blogController.getRelatedPosts(1L, 3);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getCategories_shouldReturn200() {
        when(blogService.getAllCategories()).thenReturn(List.of(categoryResponse));

        ResponseEntity<?> response = blogController.getCategories();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getCategoryBySlug_shouldReturn200() {
        when(blogService.getCategoryBySlug("health")).thenReturn(categoryResponse);

        ResponseEntity<?> response = blogController.getCategoryBySlug("health");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getTags_shouldReturn200() {
        when(blogService.getAllTags()).thenReturn(List.of(tagResponse));

        ResponseEntity<?> response = blogController.getTags();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getTagBySlug_shouldReturn200() {
        when(blogService.getTagBySlug("organic")).thenReturn(tagResponse);

        ResponseEntity<?> response = blogController.getTagBySlug("organic");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getBlogSitemap_shouldReturnXml() {
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(postResponse));

        ResponseEntity<String> response = blogController.getBlogSitemap();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).contains("<urlset");
        assertThat(response.getBody()).contains("test");
    }

    @Test
    void getBlogSitemap_withNoUpdatedAt_shouldUsePublishedAt() {
        BlogPostResponse noUpdate = BlogPostResponse.builder()
                .id(2L).title("No Update").slug("no-update")
                .status("PUBLISHED")
                .publishedAt(LocalDateTime.of(2025, 1, 1, 0, 0))
                .categories(Collections.emptyList())
                .tags(Collections.emptyList())
                .build();
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(noUpdate));

        ResponseEntity<String> response = blogController.getBlogSitemap();

        assertThat(response.getBody()).contains("2025-01-01");
    }

    @Test
    void getBlogSitemap_withNoDates_shouldOmitLastmod() {
        BlogPostResponse noDates = BlogPostResponse.builder()
                .id(3L).title("No Dates").slug("no-dates")
                .status("PUBLISHED")
                .categories(Collections.emptyList())
                .tags(Collections.emptyList())
                .build();
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(noDates));

        ResponseEntity<String> response = blogController.getBlogSitemap();

        assertThat(response.getBody()).doesNotContain("<lastmod>");
    }

    @Test
    void getRssFeed_shouldReturnXml() {
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(postResponse));

        ResponseEntity<String> response = blogController.getRssFeed();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).contains("<rss");
        assertThat(response.getBody()).contains("<title>Test</title>");
    }

    @Test
    void getRssFeed_withNullExcerptAndAuthor_shouldOmitThem() {
        BlogPostResponse minimal = BlogPostResponse.builder()
                .id(4L).title("Min").slug("min")
                .status("PUBLISHED")
                .categories(Collections.emptyList())
                .tags(Collections.emptyList())
                .build();
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(minimal));

        ResponseEntity<String> response = blogController.getRssFeed();

        assertThat(response.getBody()).doesNotContain("<author>");
        // channel-level <description> is always present; item-level should be absent
        String itemBlock = response.getBody().substring(response.getBody().indexOf("<item>"));
        assertThat(itemBlock).doesNotContain("<description>");
    }

    @Test
    void getRssFeed_withSpecialChars_shouldEscapeXml() {
        BlogPostResponse special = BlogPostResponse.builder()
                .id(5L).title("A & B <C>").slug("special")
                .status("PUBLISHED")
                .excerpt("x > y & z")
                .authorName("O'Brien")
                .publishedAt(LocalDateTime.now())
                .categories(Collections.emptyList())
                .tags(Collections.emptyList())
                .build();
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(special));

        ResponseEntity<String> response = blogController.getRssFeed();

        assertThat(response.getBody()).contains("A &amp; B &lt;C&gt;");
        assertThat(response.getBody()).contains("O&apos;Brien");
    }
}
