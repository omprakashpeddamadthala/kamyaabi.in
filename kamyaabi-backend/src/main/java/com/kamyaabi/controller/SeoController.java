package com.kamyaabi.controller;

import com.kamyaabi.dto.response.BlogCategoryResponse;
import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.BlogTagResponse;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.dto.response.ProductSitemapResponse;
import com.kamyaabi.service.BlogService;
import com.kamyaabi.service.CategoryService;
import com.kamyaabi.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@Tag(name = "SEO", description = "Public sitemap.xml, sitemap-index.xml and robots.txt endpoints")
public class SeoController {

    // Static routes that should appear in the sitemap (login/private pages excluded intentionally).
    private static final List<StaticRoute> STATIC_ROUTES = List.of(
            new StaticRoute("/", "daily", "1.0"),
            new StaticRoute("/products", "daily", "0.9"),
            new StaticRoute("/blog", "daily", "0.8"),
            new StaticRoute("/about", "monthly", "0.5"),
            new StaticRoute("/contact", "monthly", "0.5"),
            new StaticRoute("/track-order", "monthly", "0.4"),
            new StaticRoute("/refund-policy", "yearly", "0.3")
            // /login intentionally excluded — private/transactional page, not indexable.
    );

    private static final List<String> DISALLOWED_PATHS = List.of(
            "/api/", "/admin", "/cart", "/checkout", "/orders", "/order",
            "/profile", "/wishlist", "/login", "/oauth2/", "/swagger-ui/",
            "/api-docs", "/v3/api-docs"
    );

    private final ProductService productService;
    private final CategoryService categoryService;
    private final BlogService blogService;
    private final String publicSiteUrl;

    public SeoController(ProductService productService,
                         CategoryService categoryService,
                         BlogService blogService,
                         @Value("${app.frontend-url:https://kamyaabi.in}") String publicSiteUrl) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.blogService = blogService;
        this.publicSiteUrl = removeTrailingSlash(publicSiteUrl);
    }

    // =========================================================================
    // Sitemap Index
    // =========================================================================

    @GetMapping(value = "/sitemap-index.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Sitemap Index",
            description = "References all sub-sitemaps. Submit this URL to Google Search Console.")
    public ResponseEntity<String> getSitemapIndex() {
        String now = LocalDateTime.now().toLocalDate().toString();
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        appendSitemapEntry(xml, publicSiteUrl + "/sitemap.xml", now);
        appendSitemapEntry(xml, publicSiteUrl + "/products-sitemap.xml", now);
        appendSitemapEntry(xml, publicSiteUrl + "/blogs-sitemap.xml", now);
        appendSitemapEntry(xml, publicSiteUrl + "/categories-sitemap.xml", now);
        appendSitemapEntry(xml, publicSiteUrl + "/images-sitemap.xml", now);
        xml.append("</sitemapindex>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(30)).cachePublic().mustRevalidate())
                .body(xml.toString());
    }

    // =========================================================================
    // Main sitemap (static + category pages)
    // =========================================================================

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Main XML sitemap",
            description = "Static pages and category pages. Product/blog detail pages are in their own sub-sitemaps.")
    public ResponseEntity<String> getSitemap() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        List<ProductSitemapResponse> products = productService.getSitemapProducts();

        // Collect category slugs that actually have products.
        Set<String> usedCategorySlugs = new HashSet<>();
        for (ProductSitemapResponse p : products) {
            if (!isBlank(p.categorySlug())) usedCategorySlugs.add(p.categorySlug());
        }

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (StaticRoute route : STATIC_ROUTES) {
            appendUrl(xml, publicSiteUrl + route.path(), null, route.changefreq(), route.priority());
        }

        for (CategoryResponse category : categories) {
            if (isBlank(category.slug()) || !usedCategorySlugs.contains(category.slug())) continue;
            appendUrl(xml, publicSiteUrl + "/products/category/" + category.slug(),
                    lastModified(category.updatedAt()), "weekly", "0.7");
        }

        xml.append("</urlset>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic().mustRevalidate())
                .body(xml.toString());
    }

    // =========================================================================
    // Products sub-sitemap
    // =========================================================================

    @GetMapping(value = "/products-sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Products XML sitemap", description = "All active product detail pages.")
    public ResponseEntity<String> getProductsSitemap() {
        List<ProductSitemapResponse> products = productService.getSitemapProducts();

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (ProductSitemapResponse product : products) {
            if (isBlank(product.slug())) continue;
            String path = isBlank(product.categorySlug())
                    ? "/products/" + product.slug()
                    : "/products/" + product.categorySlug() + "/" + product.slug();
            appendUrl(xml, publicSiteUrl + path,
                    lastModified(product.updatedAt(), product.createdAt()), "weekly", "0.8");
        }

        xml.append("</urlset>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic().mustRevalidate())
                .body(xml.toString());
    }

    // =========================================================================
    // Blog posts sub-sitemap
    // =========================================================================

    @GetMapping(value = "/blogs-sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Blog posts XML sitemap", description = "All published blog post pages.")
    public ResponseEntity<String> getBlogsSitemap() {
        List<BlogPostResponse> posts = blogService.getAllPublishedPosts();
        List<BlogCategoryResponse> blogCategories = blogService.getAllCategories();
        List<BlogTagResponse> blogTags = blogService.getAllTags();

        Map<String, LocalDateTime> blogCategoryLastModified = new HashMap<>();
        Map<String, LocalDateTime> blogTagLastModified = new HashMap<>();
        Set<String> publishedBlogCategorySlugs = new HashSet<>();
        Set<String> publishedBlogTagSlugs = new HashSet<>();

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (BlogPostResponse post : posts) {
            if (isBlank(post.slug())) continue;
            LocalDateTime postLastModified = firstNonNull(post.updatedAt(), post.publishedAt(), post.createdAt());
            appendUrl(xml, publicSiteUrl + "/blog/" + post.slug(),
                    lastModified(postLastModified), "weekly", "0.7");

            if (post.categories() != null) {
                for (BlogCategoryResponse category : post.categories()) {
                    if (!isBlank(category.slug())) {
                        publishedBlogCategorySlugs.add(category.slug());
                        if (postLastModified != null) {
                            blogCategoryLastModified.merge(category.slug(), postLastModified, SeoController::latest);
                        }
                    }
                }
            }
            if (post.tags() != null) {
                for (BlogTagResponse tag : post.tags()) {
                    if (!isBlank(tag.slug())) {
                        publishedBlogTagSlugs.add(tag.slug());
                        if (postLastModified != null) {
                            blogTagLastModified.merge(tag.slug(), postLastModified, SeoController::latest);
                        }
                    }
                }
            }
        }

        for (BlogCategoryResponse category : blogCategories) {
            if (isBlank(category.slug()) || !publishedBlogCategorySlugs.contains(category.slug())) continue;
            appendUrl(xml, publicSiteUrl + "/blog/category/" + category.slug(),
                    lastModified(blogCategoryLastModified.get(category.slug()), category.createdAt()), "weekly", "0.6");
        }

        for (BlogTagResponse tag : blogTags) {
            if (isBlank(tag.slug()) || !publishedBlogTagSlugs.contains(tag.slug())) continue;
            appendUrl(xml, publicSiteUrl + "/blog/tag/" + tag.slug(),
                    lastModified(blogTagLastModified.get(tag.slug()), tag.createdAt()), "weekly", "0.5");
        }

        xml.append("</urlset>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic().mustRevalidate())
                .body(xml.toString());
    }

    // =========================================================================
    // Categories sub-sitemap
    // =========================================================================

    @GetMapping(value = "/categories-sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Categories XML sitemap", description = "All product category pages.")
    public ResponseEntity<String> getCategoriesSitemap() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        List<ProductSitemapResponse> products = productService.getSitemapProducts();

        Set<String> usedCategorySlugs = new HashSet<>();
        for (ProductSitemapResponse p : products) {
            if (!isBlank(p.categorySlug())) usedCategorySlugs.add(p.categorySlug());
        }

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (CategoryResponse category : categories) {
            if (isBlank(category.slug()) || !usedCategorySlugs.contains(category.slug())) continue;
            appendUrl(xml, publicSiteUrl + "/products/category/" + category.slug(),
                    lastModified(category.updatedAt()), "weekly", "0.7");
        }

        xml.append("</urlset>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic().mustRevalidate())
                .body(xml.toString());
    }

    // =========================================================================
    // Images sub-sitemap
    // =========================================================================

    @GetMapping(value = "/images-sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Images XML sitemap",
            description = "Product images for Google Image Search indexing.")
    public ResponseEntity<String> getImagesSitemap() {
        List<ProductSitemapResponse> products = productService.getSitemapProducts();

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"\n");
        xml.append("        xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n");

        for (ProductSitemapResponse product : products) {
            if (isBlank(product.slug())) continue;
            String imageUrl = product.mainImageUrl();
            if (isBlank(imageUrl)) imageUrl = product.imageUrl();
            if (isBlank(imageUrl)) continue;

            String path = isBlank(product.categorySlug())
                    ? "/products/" + product.slug()
                    : "/products/" + product.categorySlug() + "/" + product.slug();

            xml.append("  <url>\n");
            xml.append("    <loc>").append(escapeXml(publicSiteUrl + path)).append("</loc>\n");
            xml.append("    <image:image>\n");
            xml.append("      <image:loc>").append(escapeXml(imageUrl)).append("</image:loc>\n");
            if (!isBlank(product.name())) {
                xml.append("      <image:title>").append(escapeXml(product.name())).append("</image:title>\n");
            }
            xml.append("    </image:image>\n");
            xml.append("  </url>\n");
        }

        xml.append("</urlset>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic().mustRevalidate())
                .body(xml.toString());
    }

    // =========================================================================
    // robots.txt
    // =========================================================================

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "robots.txt",
            description = "Allows public pages, blocks private areas, and references all sitemaps.")
    public ResponseEntity<String> getRobots() {
        StringBuilder robots = new StringBuilder();
        robots.append("User-agent: *\n");
        robots.append("Allow: /\n");
        for (String path : DISALLOWED_PATHS) {
            robots.append("Disallow: ").append(path).append('\n');
        }
        robots.append("\n");
        // Reference the sitemap index so Google submits all sub-sitemaps at once.
        robots.append("Sitemap: ").append(publicSiteUrl).append("/sitemap-index.xml\n");
        robots.append("Sitemap: ").append(publicSiteUrl).append("/sitemap.xml\n");
        robots.append("Sitemap: ").append(publicSiteUrl).append("/products-sitemap.xml\n");
        robots.append("Sitemap: ").append(publicSiteUrl).append("/blogs-sitemap.xml\n");
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic().mustRevalidate())
                .body(robots.toString());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private static void appendSitemapEntry(StringBuilder xml, String loc, String lastmod) {
        xml.append("  <sitemap>\n");
        xml.append("    <loc>").append(escapeXml(loc)).append("</loc>\n");
        if (lastmod != null) {
            xml.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        }
        xml.append("  </sitemap>\n");
    }

    private static void appendUrl(StringBuilder xml, String loc, String lastmod,
                                  String changefreq, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(escapeXml(loc)).append("</loc>\n");
        if (lastmod != null) {
            xml.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        }
        xml.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n");
    }

    private static String lastModified(LocalDateTime... candidates) {
        for (LocalDateTime candidate : candidates) {
            if (candidate != null) return candidate.toLocalDate().toString();
        }
        return null;
    }

    private static LocalDateTime firstNonNull(LocalDateTime... candidates) {
        for (LocalDateTime candidate : candidates) {
            if (candidate != null) return candidate;
        }
        return null;
    }

    private static LocalDateTime latest(LocalDateTime first, LocalDateTime second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.isAfter(second) ? first : second;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String removeTrailingSlash(String value) {
        String normalized = isBlank(value) ? "https://kamyaabi.in" : value.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private record StaticRoute(String path, String changefreq, String priority) {
    }
}
