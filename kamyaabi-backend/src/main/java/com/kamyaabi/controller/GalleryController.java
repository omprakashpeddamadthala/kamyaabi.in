package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.entity.GalleryImage;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.GalleryImageRepository;
import com.kamyaabi.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@Tag(name = "Gallery", description = "Gallery image endpoints")
public class GalleryController {

    private final GalleryImageRepository galleryImageRepository;
    private final CloudinaryService cloudinaryService;

    public GalleryController(GalleryImageRepository galleryImageRepository,
                             CloudinaryService cloudinaryService) {
        this.galleryImageRepository = galleryImageRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @GetMapping("/api/gallery")
    @Operation(summary = "Get all gallery images", description = "Public endpoint — returns all gallery images ordered by displayOrder.")
    public ResponseEntity<ApiResponse<List<GalleryImage>>> getAllImages() {
        return ResponseEntity.ok(ApiResponse.success(
                galleryImageRepository.findAllByOrderByDisplayOrderAscUploadedAtDesc()));
    }

    @PostMapping(value = "/api/admin/gallery/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload gallery image", description = "Admin uploads a new gallery image (multipart/form-data).")
    public ResponseEntity<ApiResponse<GalleryImage>> uploadImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "displayOrder", defaultValue = "0") int displayOrder) {
        CloudinaryService.UploadResult result = cloudinaryService.uploadImage(image);
        GalleryImage galleryImage = GalleryImage.builder()
                .imageUrl(result.secureUrl())
                .publicId(result.publicId())
                .displayOrder(displayOrder)
                .build();
        galleryImage = galleryImageRepository.save(galleryImage);
        log.info("Gallery image uploaded: id={}", galleryImage.getId());
        return ResponseEntity.ok(ApiResponse.success("Image uploaded", galleryImage));
    }

    @DeleteMapping("/api/admin/gallery/{id}")
    @Operation(summary = "Delete gallery image", description = "Admin deletes a gallery image by ID.")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable Long id) {
        GalleryImage image = galleryImageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GalleryImage", id));
        if (image.getPublicId() != null) {
            cloudinaryService.deleteImage(image.getPublicId());
        }
        galleryImageRepository.delete(image);
        log.info("Gallery image deleted: id={}", id);
        return ResponseEntity.ok(ApiResponse.success("Image deleted", null));
    }
}
