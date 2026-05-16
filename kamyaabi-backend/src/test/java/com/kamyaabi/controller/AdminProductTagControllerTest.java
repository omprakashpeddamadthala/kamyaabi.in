package com.kamyaabi.controller;

import com.kamyaabi.dto.request.ProductTagRequest;
import com.kamyaabi.dto.response.ProductTagResponse;
import com.kamyaabi.service.ProductTagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminProductTagControllerTest {

    @Mock private ProductTagService productTagService;

    @InjectMocks private AdminProductTagController controller;

    private ProductTagResponse tagResponse;

    @BeforeEach
    void setUp() {
        tagResponse = ProductTagResponse.builder()
                .id(1L).name("Organic").slug("organic").build();
    }

    @Test
    void getAllTags_shouldReturn200() {
        when(productTagService.getAllTags()).thenReturn(List.of(tagResponse));

        ResponseEntity<?> response = controller.getAllTags();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getTag_shouldReturn200() {
        when(productTagService.getTagById(1L)).thenReturn(tagResponse);

        ResponseEntity<?> response = controller.getTag(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void createTag_shouldReturn201() {
        ProductTagRequest request = ProductTagRequest.builder().name("New").build();
        when(productTagService.createTag(request)).thenReturn(tagResponse);

        ResponseEntity<?> response = controller.createTag(request);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
    }

    @Test
    void updateTag_shouldReturn200() {
        ProductTagRequest request = ProductTagRequest.builder().name("Updated").build();
        when(productTagService.updateTag(eq(1L), any())).thenReturn(tagResponse);

        ResponseEntity<?> response = controller.updateTag(1L, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void deleteTag_shouldReturn200() {
        ResponseEntity<?> response = controller.deleteTag(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(productTagService).deleteTag(1L);
    }

    @Test
    void mergeTags_shouldReturn200() {
        ResponseEntity<?> response = controller.mergeTags(1L, 2L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(productTagService).mergeTags(1L, 2L);
    }
}
