package com.kamyaabi.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.BusinessException;
import com.kamyaabi.service.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CloudinaryServiceImplTest {

    private Cloudinary cloudinary;
    private Uploader uploader;
    private CloudinaryServiceImpl service;

    @BeforeEach
    void setUp() {
        cloudinary = mock(Cloudinary.class);
        uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        service = new CloudinaryServiceImpl(cloudinary);
    }

    @Test
    void uploadImage_success_returnsUrlAndPublicId() throws IOException {
        MultipartFile file = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[] {1, 2, 3});
        when(uploader.upload(any(byte[].class), any()))
                .thenReturn(Map.of(
                        "secure_url", "https://res.cloudinary.com/x/image/upload/v1/a.jpg",
                        "public_id", "kamyaabi/products/abc"
                ));

        CloudinaryService.UploadResult result = service.uploadImage(file);

        assertThat(result.secureUrl()).isEqualTo("https://res.cloudinary.com/x/image/upload/v1/a.jpg");
        assertThat(result.publicId()).isEqualTo("kamyaabi/products/abc");
    }

    @Test
    void uploadImage_nullFile_throwsBadRequest() {
        assertThatThrownBy(() -> service.uploadImage(null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void uploadImage_emptyFile_throwsBadRequest() {
        MultipartFile file = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[0]);
        assertThatThrownBy(() -> service.uploadImage(file))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void uploadImage_unsupportedType_throwsBadRequest() {
        MultipartFile file = new MockMultipartFile("images", "a.bmp", "image/bmp", new byte[] {1});
        assertThatThrownBy(() -> service.uploadImage(file))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void uploadImage_gifIsAccepted() throws IOException {
        MultipartFile file = new MockMultipartFile("images", "a.gif", "image/gif", new byte[] {1});
        when(uploader.upload(any(byte[].class), any()))
                .thenReturn(Map.of(
                        "secure_url", "https://res.cloudinary.com/x/image/upload/v1/a.gif",
                        "public_id", "kamyaabi/products/abc"
                ));

        assertThat(service.uploadImage(file).publicId()).isEqualTo("kamyaabi/products/abc");
    }

    @Test
    void uploadImage_avifIsAccepted() throws IOException {
        MultipartFile file = new MockMultipartFile("images", "a.avif", "image/avif", new byte[] {1});
        when(uploader.upload(any(byte[].class), any()))
                .thenReturn(Map.of(
                        "secure_url", "https://res.cloudinary.com/x/image/upload/v1/a.avif",
                        "public_id", "kamyaabi/products/avif"
                ));

        assertThat(service.uploadImage(file).publicId()).isEqualTo("kamyaabi/products/avif");
    }

    @Test
    void uploadImage_largeFileIsAccepted() throws IOException {
        byte[] big = new byte[10 * 1024 * 1024 + 1];
        MultipartFile file = new MockMultipartFile("images", "big.jpg", "image/jpeg", big);
        when(uploader.upload(any(byte[].class), any()))
                .thenReturn(Map.of(
                        "secure_url", "https://res.cloudinary.com/x/image/upload/v1/big.jpg",
                        "public_id", "kamyaabi/products/big"
                ));

        assertThat(service.uploadImage(file).publicId()).isEqualTo("kamyaabi/products/big");
    }

    @Test
    void uploadImage_ioFailure_throwsBusinessException() throws IOException {
        MultipartFile file = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[] {1});
        when(uploader.upload(any(byte[].class), any()))
                .thenThrow(new IOException("network down"));

        assertThatThrownBy(() -> service.uploadImage(file))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void uploadImage_incompleteResponse_throwsBusinessException() throws IOException {
        MultipartFile file = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[] {1});
        when(uploader.upload(any(byte[].class), any()))
                .thenReturn(Map.of("public_id", "only-id"));

        assertThatThrownBy(() -> service.uploadImage(file))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void deleteImage_success_returnsTrue() throws IOException {
        when(uploader.destroy(any(), any())).thenReturn(Map.of("result", "ok"));

        assertThat(service.deleteImage("abc")).isTrue();
    }

    @Test
    void deleteImage_notFound_stillReturnsTrue() throws IOException {
        when(uploader.destroy(any(), any())).thenReturn(Map.of("result", "not found"));

        assertThat(service.deleteImage("abc")).isTrue();
    }

    @Test
    void deleteImage_nonOkStatus_returnsFalse() throws IOException {
        when(uploader.destroy(any(), any())).thenReturn(Map.of("result", "fail"));

        assertThat(service.deleteImage("abc")).isFalse();
    }

    @Test
    void deleteImage_ioFailure_returnsFalse() throws IOException {
        when(uploader.destroy(any(), any())).thenThrow(new IOException("boom"));

        assertThat(service.deleteImage("abc")).isFalse();
    }

    @Test
    void deleteImage_blankPublicId_returnsFalse() {
        assertThat(service.deleteImage("")).isFalse();
        assertThat(service.deleteImage(null)).isFalse();
    }
}
