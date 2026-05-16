package com.kamyaabi.controller;

import com.kamyaabi.dto.request.BlogCategoryRequest;
import com.kamyaabi.dto.request.BlogPostRequest;
import com.kamyaabi.dto.request.BlogTagRequest;
import com.kamyaabi.dto.response.*;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.BlogService;
import com.kamyaabi.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/blog")
@Tag(name = "Admin Blog", description = "Admin blog management endpoints")
public class AdminBlogController {

    private final BlogService blogService;
    private final CloudinaryService cloudinaryService;
    private final CurrentUser currentUser;

    public AdminBlogController(BlogService blogService,
                               CloudinaryService cloudinaryService,
                               CurrentUser currentUser) {
        this.blogService = blogService;
        this.cloudinaryService = cloudinaryService;
        this.currentUser = currentUser;
    }

    // ── Posts ────────────────────────────────────────────────────

    @GetMapping("/posts")
    @Operation(summary = "List all blog posts (admin)", description = "Paginated list with optional status and search filters")
    public ResponseEntity<ApiResponse<Page<BlogPostResponse>>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(blogService.getAdminPosts(status, q, pageable)));
    }

    @GetMapping("/posts/{id}")
    @Operation(summary = "Get blog post by ID (admin)")
    public ResponseEntity<ApiResponse<BlogPostResponse>> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(blogService.getAdminPostById(id)));
    }

    @PostMapping("/posts")
    @Operation(summary = "Create blog post")
    public ResponseEntity<ApiResponse<BlogPostResponse>> createPost(
            @Valid @RequestBody BlogPostRequest request) {
        Long authorId = (request.authorId() != null) ? request.authorId() : currentUser.getUserId();
        BlogPostResponse post = blogService.createPost(request, authorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Blog post created", post));
    }

    @PutMapping("/posts/{id}")
    @Operation(summary = "Update blog post")
    public ResponseEntity<ApiResponse<BlogPostResponse>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody BlogPostRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Blog post updated", blogService.updatePost(id, request)));
    }

    @DeleteMapping("/posts/{id}")
    @Operation(summary = "Delete blog post")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        blogService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.success("Blog post deleted", null));
    }

    @PostMapping("/posts/{id}/publish")
    @Operation(summary = "Publish blog post immediately")
    public ResponseEntity<ApiResponse<BlogPostResponse>> publishPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Blog post published", blogService.publishPost(id)));
    }

    @PostMapping("/posts/{id}/unpublish")
    @Operation(summary = "Unpublish blog post (revert to draft)")
    public ResponseEntity<ApiResponse<BlogPostResponse>> unpublishPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Blog post unpublished", blogService.unpublishPost(id)));
    }

    // ── Media ───────────────────────────────────────────────────

    @PostMapping("/media/upload")
    @Operation(summary = "Upload blog image", description = "Uploads to Cloudinary and returns the URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadMedia(
            @RequestParam("file") MultipartFile file) {
        CloudinaryService.UploadResult result = cloudinaryService.uploadImage(file);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "url", result.secureUrl(),
                "publicId", result.publicId()
        )));
    }

    // ── Categories ──────────────────────────────────────────────

    @GetMapping("/categories")
    @Operation(summary = "List blog categories (admin)")
    public ResponseEntity<ApiResponse<List<BlogCategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(blogService.getAllCategories()));
    }

    @PostMapping("/categories")
    @Operation(summary = "Create blog category")
    public ResponseEntity<ApiResponse<BlogCategoryResponse>> createCategory(
            @Valid @RequestBody BlogCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Blog category created", blogService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update blog category")
    public ResponseEntity<ApiResponse<BlogCategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody BlogCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Blog category updated", blogService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Delete blog category")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        blogService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Blog category deleted", null));
    }

    // ── Tags ────────────────────────────────────────────────────

    @GetMapping("/tags")
    @Operation(summary = "List blog tags (admin)")
    public ResponseEntity<ApiResponse<List<BlogTagResponse>>> getTags() {
        return ResponseEntity.ok(ApiResponse.success(blogService.getAllTags()));
    }

    @PostMapping("/tags")
    @Operation(summary = "Create blog tag")
    public ResponseEntity<ApiResponse<BlogTagResponse>> createTag(
            @Valid @RequestBody BlogTagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Blog tag created", blogService.createTag(request)));
    }

    @PutMapping("/tags/{id}")
    @Operation(summary = "Update blog tag")
    public ResponseEntity<ApiResponse<BlogTagResponse>> updateTag(
            @PathVariable Long id,
            @Valid @RequestBody BlogTagRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Blog tag updated", blogService.updateTag(id, request)));
    }

    @DeleteMapping("/tags/{id}")
    @Operation(summary = "Delete blog tag")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long id) {
        blogService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.success("Blog tag deleted", null));
    }
}
