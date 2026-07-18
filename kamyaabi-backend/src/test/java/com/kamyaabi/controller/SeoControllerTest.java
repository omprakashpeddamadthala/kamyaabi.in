package com.kamyaabi.controller;

import com.kamyaabi.dto.response.BlogCategoryResponse;
import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.BlogTagResponse;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.dto.response.ProductSitemapResponse;
import com.kamyaabi.service.BlogService;
import com.kamyaabi.service.CategoryService;
import com.kamyaabi.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SeoControllerTest {

    @Mock private ProductService productService;
    @Mock private CategoryService categoryService;
    @Mock private BlogService blogService;

    private SeoController controller;

    @BeforeEach
    void setUp() {
        controller = new SeoController(productService, categoryService, blogService, "https://kamyaabi.in/");
    }

    @Test
    void sitemap_shouldContainCompleteCanonicalUrlsAndValidXml() throws Exception {
        LocalDateTime updatedAt = LocalDateTime.of(2026, 7, 10, 12, 0);
        when(productService.getSitemapProducts()).thenReturn(List.of(
                new ProductSitemapResponse("premium-cashews", "cashews", updatedAt, updatedAt.minusDays(1))));
        when(categoryService.getAllCategories()).thenReturn(List.of(
                CategoryResponse.builder().name("Cashews").slug("cashews").updatedAt(updatedAt).build()));
        BlogCategoryResponse blogCategory = BlogCategoryResponse.builder()
                .name("Nutrition").slug("nutrition").createdAt(updatedAt).build();
        BlogTagResponse blogTag = BlogTagResponse.builder()
                .name("Health").slug("health").createdAt(updatedAt).build();
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(
                BlogPostResponse.builder().title("Nutrition Guide").slug("nutrition-guide")
                        .updatedAt(updatedAt).categories(List.of(blogCategory)).tags(List.of(blogTag)).build()));
        when(blogService.getAllCategories()).thenReturn(List.of(blogCategory));
        when(blogService.getAllTags()).thenReturn(List.of(blogTag));

        var response = controller.getSitemap();
        String xml = response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_XML);
        assertThat(xml)
                .contains("<loc>https://kamyaabi.in/products/cashews/premium-cashews</loc>")
                .contains("<loc>https://kamyaabi.in/products/category/cashews</loc>")
                .contains("<loc>https://kamyaabi.in/blog/nutrition-guide</loc>")
                .contains("<loc>https://kamyaabi.in/blog/category/nutrition</loc>")
                .contains("<loc>https://kamyaabi.in/blog/tag/health</loc>")
                .contains("<lastmod>2026-07-10</lastmod>")
                .doesNotContain("<loc>http://");
        DocumentBuilderFactory.newInstance().newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void sitemap_shouldExcludeEmptyTaxonomyPages() {
        when(productService.getSitemapProducts()).thenReturn(List.of());
        when(categoryService.getAllCategories()).thenReturn(List.of(
                CategoryResponse.builder().slug("empty-category").build()));
        when(blogService.getAllPublishedPosts()).thenReturn(List.of());
        when(blogService.getAllCategories()).thenReturn(List.of(
                BlogCategoryResponse.builder().slug("empty-blog-category").build()));
        when(blogService.getAllTags()).thenReturn(List.of(
                BlogTagResponse.builder().slug("empty-tag").build()));

        String xml = controller.getSitemap().getBody();

        assertThat(xml)
                .doesNotContain("empty-category")
                .doesNotContain("empty-blog-category")
                .doesNotContain("empty-tag");
    }

    @Test
    void robots_shouldAllowPublicContentAndReferenceHttpsSitemap() {
        var response = controller.getRobots();

        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_PLAIN);
        assertThat(response.getBody())
                .contains("Sitemap: https://kamyaabi.in/sitemap.xml")
                .contains("Disallow: /admin")
                .doesNotContain("Disallow: /products")
                .doesNotContain("Disallow: /blog")
                .doesNotContain("Disallow: /login");
    }
}
