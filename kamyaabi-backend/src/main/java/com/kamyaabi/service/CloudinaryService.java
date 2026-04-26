package com.kamyaabi.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction over Cloudinary for uploading and deleting product image assets.
 *
 * <p>Implementations are responsible for validating incoming {@link MultipartFile}s
 * (content type + size) before calling the underlying SDK, so that callers
 * receive a {@code BadRequestException} for bad input instead of an opaque
 * third-party failure.
 */
public interface CloudinaryService {

    /**
     * Result of a successful Cloudinary upload.
     *
     * @param secureUrl HTTPS URL of the uploaded asset (suitable for the frontend).
     * @param publicId  Cloudinary public id, used for subsequent deletes.
     */
    record UploadResult(String secureUrl, String publicId) {}

    /**
     * Upload a single image file to Cloudinary under the configured folder.
     *
     * @param file multipart file from an admin upload request
     * @return the uploaded asset's URL and public id
     */
    UploadResult uploadImage(MultipartFile file);

    /**
     * Delete an image from Cloudinary by its public id. Implementations should
     * log a warning on failure rather than throwing, so that callers can still
     * remove the DB record even when the remote delete fails.
     *
     * @param publicId Cloudinary public id returned from {@link #uploadImage}
     * @return true if Cloudinary reported the asset as deleted or absent
     */
    boolean deleteImage(String publicId);
}
