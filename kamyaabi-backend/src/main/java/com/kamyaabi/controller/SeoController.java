package com.kamyaabi.controller;

import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.ProductResponse;
import com.kamyaabi.service.BlogService;
import com.kamyaabi.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.Set;

/**
 * GSC FIX: serves the site-wide {@code /sitemap.xml} and {@code /robots.txt}
 * that Google Search Console reported as missing.
 *
 * <p>The SPA previously let both paths fall through to {@code index.html}, so
 * Google received an HTML shell instead of a real sitemap / robots file. These
 * endpoints are mapped at the domain root (not under {@code /api}) and are
 * wired through nginx so they resolve at e.g. {@code https://kamyaabi.in/sitemap.xml}.
 *
 * <p>URLs are built from the forwarded host/scheme so the same code serves the
 * correct absolute URLs for every domain the app is hosted on (kamyaabi.in and
 * kamyaabi.shop) without hard-coding.
 */
@Slf4j
@RestController
@Tag(name = "SEO", description = "Public sitemap.xml and robots.txt endpoints")
public class SeoController {

    private static final String DEFAULT_HOST = "kamyaabi.in";

    /** Stable, crawlable storefront routes that always belong in the sitemap. */
    private static final List<StaticRoute> STATIC_ROUTES = List.of(
            new StaticRoute("/", "daily", "1.0"),
            new StaticRoute("/products", "daily", "0.9"),
            new StaticRoute("/blog", "weekly", "0.7"),
            new StaticRoute("/about", "monthly", "0.5"),
            new StaticRoute("/contact", "monthly", "0.5"),
            new StaticRoute("/track-order", "monthly", "0.4"),
            new StaticRoute("/refund-policy", "yearly", "0.3")
    );

    /**
     * Private / transactional areas that must never be indexed. Mirrors the
     * `noindex` meta tags added on the corresponding React pages.
     */
    private static final Set<String> DISALLOWED_PATHS = Set.of(
            "/api/", "/admin", "/cart", "/checkout", "/orders", "/order",
            "/profile", "/wishlist", "/login", "/oauth2/", "/swagger-ui/", "/v3/api-docs"
    );

    private final ProductService productService;
    private final BlogService blogService;

    public SeoController(ProductService productService, BlogService blogService) {
        this.productService = productService;
        this.blogService = blogService;
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "XML sitemap",
            description = "Sitemap of all public storefront pages, active products and published blog posts.")
    public ResponseEntity<String> getSitemap(HttpServletRequest request) {
        String base = baseUrl(request);
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        for (StaticRoute route : STATIC_ROUTES) {
            appendUrl(sb, base + route.path(), null, route.changefreq(), route.priority());
        }

        // Active products — canonical /products/{categorySlug}/{slug}, falling back to
        // the flat /products/{slug} form when a category slug is unavailable.
        try {
            Page<ProductResponse> products = productService.getAllProducts(PageRequest.of(0, 1000));
            for (ProductResponse p : products.getContent()) {
                if (p.slug() == null || p.slug().isBlank()) continue;
                String loc = (p.categorySlug() != null && !p.categorySlug().isBlank())
                        ? base + "/products/" + escapeXml(p.categorySlug()) + "/" + escapeXml(p.slug())
                        : base + "/products/" + escapeXml(p.slug());
                appendUrl(sb, loc, null, "weekly", "0.8");
            }
        } catch (Exception e) {
            log.warn("Failed to add products to sitemap: {}", e.getMessage());
        }

        // Published blog posts — /blog/{slug}
        try {
            List<BlogPostResponse> posts = blogService.getAllPublishedPosts();
            for (BlogPostResponse post : posts) {
                if (post.slug() == null || post.slug().isBlank()) continue;
                String lastmod = post.updatedAt() != null
                        ? post.updatedAt().toLocalDate().toString()
                        : (post.publishedAt() != null ? post.publishedAt().toLocalDate().toString() : null);
                appendUrl(sb, base + "/blog/" + escapeXml(post.slug()), lastmod, "weekly", "0.7");
            }
        } catch (Exception e) {
            log.warn("Failed to add blog posts to sitemap: {}", e.getMessage());
        }

        sb.append("</urlset>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .body(sb.toString());
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "robots.txt",
            description = "Allows crawling of public pages, blocks private/transactional areas, points at the sitemap.")
    public ResponseEntity<String> getRobots(HttpServletRequest request) {
        String base = baseUrl(request);
        StringBuilder sb = new StringBuilder();
        sb.append("User-agent: *\n");
        for (String path : DISALLOWED_PATHS) {
            sb.append("Disallow: ").append(path).append('\n');
        }
        sb.append('\n');
        sb.append("Sitemap: ").append(base).append("/sitemap.xml\n");
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                .body(sb.toString());
    }

    /** Resolves the public scheme+host from proxy-forwarded headers. */
    private String baseUrl(HttpServletRequest request) {
        String host = firstNonBlank(
                request.getHeader("X-Forwarded-Host"),
                request.getHeader("Host"),
                request.getServerName());
        if (host == null || host.isBlank()) host = DEFAULT_HOST;
        // X-Forwarded-Host may contain a comma-separated chain; take the first.
        host = host.split(",")[0].trim();
        String proto = firstNonBlank(request.getHeader("X-Forwarded-Proto"), request.getScheme());
        if (proto == null || proto.isBlank()) proto = "https";
        return proto + "://" + host;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    private static void appendUrl(StringBuilder sb, String loc, String lastmod,
                                  String changefreq, String priority) {
        sb.append("  <url>\n");
        sb.append("    <loc>").append(loc).append("</loc>\n");
        if (lastmod != null) {
            sb.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        }
        sb.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        sb.append("    <priority>").append(priority).append("</priority>\n");
        sb.append("  </url>\n");
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
