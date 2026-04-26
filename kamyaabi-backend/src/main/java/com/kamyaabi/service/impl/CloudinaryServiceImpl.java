package com.kamyaabi.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.BusinessException;
import com.kamyaabi.service.CloudinaryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class CloudinaryServiceImpl implements CloudinaryService {

    /** Accepted MIME types for product images. */
    static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    /** Maximum upload size per image in bytes (5 MB). */
    static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    /** Cloudinary folder used for all product images. */
    static final String PRODUCTS_FOLDER = "kamyaabi/products";

    private final Cloudinary cloudinary;

    public CloudinaryServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public UploadResult uploadImage(MultipartFile file) {
        validate(file);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", PRODUCTS_FOLDER,
                            "resource_type", "image",
                            "overwrite", false,
                            "unique_filename", true
                    )
            );
            String secureUrl = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            if (secureUrl == null || publicId == null) {
                log.error("Cloudinary upload returned incomplete metadata: {}", result);
                throw new BusinessException("Image upload failed: incomplete response from Cloudinary");
            }
            log.info("Uploaded image to Cloudinary: publicId={}, size={} bytes", publicId, file.getSize());
            return new UploadResult(secureUrl, publicId);
        } catch (IOException e) {
            log.error("Cloudinary upload failed for file '{}'", file.getOriginalFilename(), e);
            throw new BusinessException("Image upload failed: " + e.getMessage());
        }
    }

    @Override
    public boolean deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return false;
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("invalidate", true)
            );
            Object raw = result.get("result");
            String status = raw == null ? "" : raw.toString();
            boolean ok = "ok".equalsIgnoreCase(status) || "not found".equalsIgnoreCase(status);
            if (ok) {
                log.info("Deleted Cloudinary asset publicId={} status={}", publicId, status);
            } else {
                log.warn("Cloudinary reported non-ok status for publicId={}: {}", publicId, status);
            }
            return ok;
        } catch (IOException e) {
            log.warn("Cloudinary delete failed for publicId={}; DB record will still be removed",
                    publicId, e);
            return false;
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required and cannot be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException(
                    "Unsupported image type: " + contentType
                            + ". Accepted: image/jpeg, image/png, image/webp");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(
                    "Image exceeds maximum size of " + (MAX_FILE_SIZE_BYTES / (1024 * 1024)) + "MB");
        }
    }
}
