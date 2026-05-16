package com.kamyaabi.controller;

import com.kamyaabi.dto.request.BlogCategoryRequest;
import com.kamyaabi.dto.request.BlogPostRequest;
import com.kamyaabi.dto.request.BlogTagRequest;
import com.kamyaabi.dto.response.BlogCategoryResponse;
import com.kamyaabi.dto.response.BlogPostResponse;
import com.kamyaabi.dto.response.BlogTagResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.BlogService;
import com.kamyaabi.service.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminBlogControllerTest {

    @Mock private BlogService blogService;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private CurrentUser currentUser;

    @InjectMocks private AdminBlogController controller;

    private BlogPostResponse postResponse;
    private BlogCategoryResponse categoryResponse;
    private BlogTagResponse tagResponse;

    @BeforeEach
    void setUp() {
        postResponse = BlogPostResponse.builder()
                .id(1L).title("Test").slug("test").status("DRAFT")
                .categories(Collections.emptyList())
                .tags(Collections.emptyList())
                .build();
        categoryResponse = BlogCategoryResponse.builder()
                .id(1L).name("Health").slug("health").build();
        tagResponse = BlogTagResponse.builder()
                .id(1L).name("Organic").slug("organic").build();
    }

    @Test
    void getPosts_shouldReturn200() {
        when(blogService.getAdminPosts(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<?> response = controller.getPosts(0, 10, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getPost_shouldReturn200() {
        when(blogService.getAdminPostById(1L)).thenReturn(postResponse);

        ResponseEntity<?> response = controller.getPost(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void createPost_withAuthorId_shouldUseProvidedId() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Test").authorId(5L).build();
        when(blogService.createPost(request, 5L)).thenReturn(postResponse);

        ResponseEntity<?> response = controller.createPost(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
    }

    @Test
    void createPost_withoutAuthorId_shouldUseCurrentUser() {
        BlogPostRequest request = BlogPostRequest.builder()
                .title("Test").build();
        when(currentUser.getUserId()).thenReturn(10L);
        when(blogService.createPost(request, 10L)).thenReturn(postResponse);

        ResponseEntity<?> response = controller.createPost(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
    }

    @Test
    void updatePost_shouldReturn200() {
        BlogPostRequest request = BlogPostRequest.builder().title("Updated").build();
        when(blogService.updatePost(eq(1L), any())).thenReturn(postResponse);

        ResponseEntity<?> response = controller.updatePost(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void deletePost_shouldReturn200() {
        ResponseEntity<?> response = controller.deletePost(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(blogService).deletePost(1L);
    }

    @Test
    void publishPost_shouldReturn200() {
        when(blogService.publishPost(1L)).thenReturn(postResponse);

        ResponseEntity<?> response = controller.publishPost(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void unpublishPost_shouldReturn200() {
        when(blogService.unpublishPost(1L)).thenReturn(postResponse);

        ResponseEntity<?> response = controller.unpublishPost(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void uploadMedia_shouldReturn200() {
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "data".getBytes());
        when(cloudinaryService.uploadImage(any()))
                .thenReturn(new CloudinaryService.UploadResult("https://img.url/test.jpg", "pub123"));

        ResponseEntity<?> response = controller.uploadMedia(file);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getCategories_shouldReturn200() {
        when(blogService.getAllCategories()).thenReturn(List.of(categoryResponse));

        ResponseEntity<?> response = controller.getCategories();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void createCategory_shouldReturn201() {
        BlogCategoryRequest request = BlogCategoryRequest.builder().name("New").build();
        when(blogService.createCategory(request)).thenReturn(categoryResponse);

        ResponseEntity<?> response = controller.createCategory(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
    }

    @Test
    void updateCategory_shouldReturn200() {
        BlogCategoryRequest request = BlogCategoryRequest.builder().name("Updated").build();
        when(blogService.updateCategory(eq(1L), any())).thenReturn(categoryResponse);

        ResponseEntity<?> response = controller.updateCategory(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void deleteCategory_shouldReturn200() {
        ResponseEntity<?> response = controller.deleteCategory(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(blogService).deleteCategory(1L);
    }

    @Test
    void getTags_shouldReturn200() {
        when(blogService.getAllTags()).thenReturn(List.of(tagResponse));

        ResponseEntity<?> response = controller.getTags();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void createTag_shouldReturn201() {
        BlogTagRequest request = BlogTagRequest.builder().name("New").build();
        when(blogService.createTag(request)).thenReturn(tagResponse);

        ResponseEntity<?> response = controller.createTag(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
    }

    @Test
    void updateTag_shouldReturn200() {
        BlogTagRequest request = BlogTagRequest.builder().name("Updated").build();
        when(blogService.updateTag(eq(1L), any())).thenReturn(tagResponse);

        ResponseEntity<?> response = controller.updateTag(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void deleteTag_shouldReturn200() {
        ResponseEntity<?> response = controller.deleteTag(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(blogService).deleteTag(1L);
    }
}
