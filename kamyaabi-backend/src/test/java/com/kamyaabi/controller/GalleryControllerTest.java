package com.kamyaabi.controller;

import com.kamyaabi.entity.GalleryImage;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.GalleryImageRepository;
import com.kamyaabi.service.CloudinaryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GalleryControllerTest {

    @Mock private GalleryImageRepository galleryImageRepository;
    @Mock private CloudinaryService cloudinaryService;

    @InjectMocks private GalleryController galleryController;

    @Test
    void getAllImages_shouldReturnList() {
        GalleryImage img = GalleryImage.builder().id(1L).imageUrl("https://example.com/img.jpg").build();
        when(galleryImageRepository.findAllByOrderByDisplayOrderAscUploadedAtDesc()).thenReturn(List.of(img));

        ResponseEntity<?> response = galleryController.getAllImages();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void uploadImage_shouldSaveAndReturn200() {
        MockMultipartFile file = new MockMultipartFile("image", "test.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(cloudinaryService.uploadImage(any())).thenReturn(new CloudinaryService.UploadResult("https://cdn.example.com/img.jpg", "pub-123"));
        GalleryImage saved = GalleryImage.builder().id(1L).imageUrl("https://cdn.example.com/img.jpg").publicId("pub-123").build();
        when(galleryImageRepository.save(any(GalleryImage.class))).thenReturn(saved);

        ResponseEntity<?> response = galleryController.uploadImage(file, 5);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(cloudinaryService).uploadImage(file);
        verify(galleryImageRepository).save(any(GalleryImage.class));
    }

    @Test
    void deleteImage_shouldDeleteFromCloudinaryAndRepo() {
        GalleryImage img = GalleryImage.builder().id(1L).imageUrl("https://cdn.example.com/img.jpg").publicId("pub-123").build();
        when(galleryImageRepository.findById(1L)).thenReturn(Optional.of(img));

        ResponseEntity<?> response = galleryController.deleteImage(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(cloudinaryService).deleteImage("pub-123");
        verify(galleryImageRepository).delete(img);
    }

    @Test
    void deleteImage_withNullPublicId_shouldSkipCloudinaryDelete() {
        GalleryImage img = GalleryImage.builder().id(2L).imageUrl("https://example.com/img.jpg").publicId(null).build();
        when(galleryImageRepository.findById(2L)).thenReturn(Optional.of(img));

        ResponseEntity<?> response = galleryController.deleteImage(2L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        verify(cloudinaryService, never()).deleteImage(any());
        verify(galleryImageRepository).delete(img);
    }

    @Test
    void deleteImage_notFound_shouldThrow() {
        when(galleryImageRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> galleryController.deleteImage(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
