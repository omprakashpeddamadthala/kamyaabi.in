package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.BlogCategoryResponse;
import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.BlogTagResponse;
import com.kamyaabi.service.BlogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/blog")
@Tag(name = "Blog", description = "Public blog endpoints")
public class BlogController {

    private final BlogService blogService;
    private final String publicSiteUrl;

    public BlogController(BlogService blogService,
                          @org.springframework.beans.factory.annotation.Value("${app.frontend-url:https://kamyaabi.in}") String publicSiteUrl) {
        this.blogService = blogService;
        // Strip trailing slash to match SeoController convention.
        this.publicSiteUrl = publicSiteUrl == null ? "https://kamyaabi.in"
                : publicSiteUrl.trim().replaceAll("/+$", "");
    }

    @GetMapping("/posts")
    @Operation(summary = "List published blog posts",
            description = "Paginated list of published posts. Supports category, tag, search, featured filters, and sorting (e.g. sort=createdAt,desc).")
    public ResponseEntity<ApiResponse<Page<BlogPostResponse>>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        String[] sortParts = sort.split(",");
        String sortField = sortParts[0];
        org.springframework.data.domain.Sort sortOrder = sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1])
                ? org.springframework.data.domain.Sort.by(sortField).ascending()
                : org.springframework.data.domain.Sort.by(sortField).descending();
        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<BlogPostResponse> posts;
        if (search != null && !search.isBlank()) {
            posts = blogService.searchPublishedPosts(search, pageable);
        } else if (category != null && !category.isBlank()) {
            posts = blogService.getPublishedPostsByCategory(category, pageable);
        } else if (tag != null && !tag.isBlank()) {
            posts = blogService.getPublishedPostsByTag(tag, pageable);
        } else if (Boolean.TRUE.equals(featured)) {
            posts = blogService.getPublishedFeaturedPosts(pageable);
        } else {
            posts = blogService.getPublishedPosts(pageable);
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .body(ApiResponse.success(posts));
    }

    @GetMapping("/posts/{slug}")
    @Operation(summary = "Get blog post by slug", description = "Returns a single published blog post")
    public ResponseEntity<ApiResponse<BlogPostResponse>> getPostBySlug(@PathVariable String slug) {
        BlogPostResponse post = blogService.getPublishedPostBySlug(slug);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic().mustRevalidate())
                .body(ApiResponse.success(post));
    }

    @PostMapping("/posts/{id}/view")
    @Operation(summary = "Increment view count", description = "Fire-and-forget view count increment")
    public ResponseEntity<ApiResponse<Void>> incrementViewCount(@PathVariable Long id) {
        blogService.incrementViewCount(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/posts/{id}/related")
    @Operation(summary = "Get related posts", description = "Returns posts sharing categories with the given post")
    public ResponseEntity<ApiResponse<List<BlogPostResponse>>> getRelatedPosts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(ApiResponse.success(blogService.getRelatedPosts(id, limit)));
    }

    @GetMapping("/categories")
    @Operation(summary = "List blog categories")
    public ResponseEntity<ApiResponse<List<BlogCategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(blogService.getAllCategories()));
    }

    @GetMapping("/categories/{slug}")
    @Operation(summary = "Get blog category by slug")
    public ResponseEntity<ApiResponse<BlogCategoryResponse>> getCategoryBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(blogService.getCategoryBySlug(slug)));
    }

    @GetMapping("/tags")
    @Operation(summary = "List blog tags")
    public ResponseEntity<ApiResponse<List<BlogTagResponse>>> getTags() {
        return ResponseEntity.ok(ApiResponse.success(blogService.getAllTags()));
    }

    @GetMapping("/tags/{slug}")
    @Operation(summary = "Get blog tag by slug")
    public ResponseEntity<ApiResponse<BlogTagResponse>> getTagBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(blogService.getTagBySlug(slug)));
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Blog sitemap", description = "XML sitemap of all published blog posts")
    public ResponseEntity<String> getBlogSitemap() {
        List<BlogPostResponse> posts = blogService.getAllPublishedPosts();
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (BlogPostResponse post : posts) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(publicSiteUrl).append("/blog/").append(escapeXml(post.slug())).append("</loc>\n");
            if (post.updatedAt() != null) {
                sb.append("    <lastmod>").append(post.updatedAt().toLocalDate().toString()).append("</lastmod>\n");
            } else if (post.publishedAt() != null) {
                sb.append("    <lastmod>").append(post.publishedAt().toLocalDate().toString()).append("</lastmod>\n");
            }
            sb.append("    <changefreq>weekly</changefreq>\n");
            sb.append("    <priority>0.7</priority>\n");
            sb.append("  </url>\n");
        }
        sb.append("</urlset>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .body(sb.toString());
    }

    @GetMapping(value = "/rss", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Blog RSS feed", description = "RSS 2.0 feed of all published blog posts")
    public ResponseEntity<String> getRssFeed() {
        List<BlogPostResponse> posts = blogService.getAllPublishedPosts();
        String rss = buildRssFeed(posts);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(30)).cachePublic())
                .body(rss);
    }

    private String buildRssFeed(List<BlogPostResponse> posts) {
        DateTimeFormatter rfc822 = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z");
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n");
        sb.append("  <channel>\n");
        sb.append("    <title>Kamyaabi Blog - Premium Dry Fruits</title>\n");
        sb.append("    <link>").append(publicSiteUrl).append("/blog</link>\n");
        sb.append("    <description>Latest articles about premium dry fruits, health tips, and recipes from Kamyaabi</description>\n");
        sb.append("    <language>en-in</language>\n");
        for (BlogPostResponse post : posts) {
            sb.append("    <item>\n");
            sb.append("      <title>").append(escapeXml(post.title())).append("</title>\n");
            sb.append("      <link>").append(publicSiteUrl).append("/blog/").append(post.slug()).append("</link>\n");
            sb.append("      <guid isPermaLink=\"true\">").append(publicSiteUrl).append("/blog/").append(post.slug()).append("</guid>\n");
            if (post.excerpt() != null) {
                sb.append("      <description>").append(escapeXml(post.excerpt())).append("</description>\n");
            }
            if (post.authorName() != null) {
                sb.append("      <author>").append(escapeXml(post.authorName())).append("</author>\n");
            }
            if (post.publishedAt() != null) {
                sb.append("      <pubDate>").append(post.publishedAt().atOffset(java.time.ZoneOffset.ofHoursMinutes(5, 30)).format(rfc822)).append("</pubDate>\n");
            }
            sb.append("    </item>\n");
        }
        sb.append("  </channel>\n");
        sb.append("</rss>");
        return sb.toString();
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
