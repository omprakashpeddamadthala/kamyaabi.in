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
    void sitemapIndex_shouldContainAllSubSitemaps() {
        var response = controller.getSitemapIndex();
        String xml = response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_XML);
        assertThat(xml)
                .contains("<loc>https://kamyaabi.in/sitemap.xml</loc>")
                .contains("<loc>https://kamyaabi.in/products-sitemap.xml</loc>")
                .contains("<loc>https://kamyaabi.in/blogs-sitemap.xml</loc>")
                .contains("<loc>https://kamyaabi.in/categories-sitemap.xml</loc>")
                .contains("<loc>https://kamyaabi.in/images-sitemap.xml</loc>");
    }

    @Test
    void mainSitemap_shouldContainStaticAndCategoryUrls() throws Exception {
        LocalDateTime updatedAt = LocalDateTime.of(2026, 7, 10, 12, 0);
        when(productService.getSitemapProducts()).thenReturn(List.of(
                new ProductSitemapResponse("premium-cashews", "Premium Cashews", "cashews", "image.jpg", "image.jpg", updatedAt, updatedAt.minusDays(1))));
        when(categoryService.getAllCategories()).thenReturn(List.of(
                CategoryResponse.builder().name("Cashews").slug("cashews").updatedAt(updatedAt).build()));

        var response = controller.getSitemap();
        String xml = response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(xml)
                .contains("<loc>https://kamyaabi.in/products/category/cashews</loc>")
                .contains("<loc>https://kamyaabi.in/</loc>")
                .doesNotContain("<loc>https://kamyaabi.in/products/cashews/premium-cashews</loc>");
    }

    @Test
    void productsSitemap_shouldContainProductUrls() {
        LocalDateTime updatedAt = LocalDateTime.of(2026, 7, 10, 12, 0);
        when(productService.getSitemapProducts()).thenReturn(List.of(
                new ProductSitemapResponse("premium-cashews", "Premium Cashews", "cashews", "image.jpg", "image.jpg", updatedAt, updatedAt.minusDays(1))));

        var response = controller.getProductsSitemap();
        String xml = response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(xml)
                .contains("<loc>https://kamyaabi.in/products/cashews/premium-cashews</loc>")
                .contains("<lastmod>2026-07-10</lastmod>");
    }

    @Test
    void blogsSitemap_shouldContainBlogUrls() {
        LocalDateTime updatedAt = LocalDateTime.of(2026, 7, 10, 12, 0);
        BlogCategoryResponse blogCategory = BlogCategoryResponse.builder()
                .name("Nutrition").slug("nutrition").createdAt(updatedAt).build();
        BlogTagResponse blogTag = BlogTagResponse.builder()
                .name("Health").slug("health").createdAt(updatedAt).build();
        when(blogService.getAllPublishedPosts()).thenReturn(List.of(
                BlogPostResponse.builder().title("Nutrition Guide").slug("nutrition-guide")
                        .updatedAt(updatedAt).categories(List.of(blogCategory)).tags(List.of(blogTag)).build()));
        when(blogService.getAllCategories()).thenReturn(List.of(blogCategory));
        when(blogService.getAllTags()).thenReturn(List.of(blogTag));

        var response = controller.getBlogsSitemap();
        String xml = response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(xml)
                .contains("<loc>https://kamyaabi.in/blog/nutrition-guide</loc>")
                .contains("<loc>https://kamyaabi.in/blog/category/nutrition</loc>")
                .contains("<loc>https://kamyaabi.in/blog/tag/health</loc>");
    }

    @Test
    void imagesSitemap_shouldContainImageUrls() {
        LocalDateTime updatedAt = LocalDateTime.of(2026, 7, 10, 12, 0);
        when(productService.getSitemapProducts()).thenReturn(List.of(
                new ProductSitemapResponse("premium-cashews", "Premium Cashews", "cashews", "img1.jpg", "img2.jpg", updatedAt, updatedAt.minusDays(1))));

        var response = controller.getImagesSitemap();
        String xml = response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(xml)
                .contains("<loc>https://kamyaabi.in/products/cashews/premium-cashews</loc>")
                .contains("<image:loc>img2.jpg</image:loc>")
                .contains("<image:title>Premium Cashews</image:title>");
    }

    @Test
    void robots_shouldAllowPublicContentAndReferenceHttpsSitemap() {
        var response = controller.getRobots();

        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_PLAIN);
        assertThat(response.getBody())
                .contains("Sitemap: https://kamyaabi.in/sitemap-index.xml")
                .contains("Disallow: /admin")
                .contains("Disallow: /login")
                .doesNotContain("Disallow: /products")
                .doesNotContain("Disallow: /blog");
    }
}
