package com.kamyaabi.service;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {

    record UploadResult(String secureUrl, String publicId) {}

    UploadResult uploadImage(MultipartFile file);

    boolean deleteImage(String publicId);
}
