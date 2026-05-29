package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.HeroBannerRequest;
import com.kamyaabi.dto.response.HeroBannerResponse;
import com.kamyaabi.entity.HeroBanner;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.HeroBannerRepository;
import com.kamyaabi.service.CloudinaryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HeroBannerServiceImplTest {

    @Mock private HeroBannerRepository heroBannerRepository;
    @Mock private CloudinaryService cloudinaryService;

    @InjectMocks private HeroBannerServiceImpl heroBannerService;

    private HeroBanner banner(Long id, int order, boolean active) {
        return HeroBanner.builder()
                .id(id)
                .imageUrl("https://cdn/img" + id + ".jpg")
                .publicId("kamyaabi/hero/" + id)
                .title("Title " + id)
                .subtitle("Subtitle " + id)
                .altText("Alt " + id)
                .linkUrl("/products")
                .displayOrder(order)
                .active(active)
                .build();
    }

    private MultipartFile image() {
        return new MockMultipartFile("image", "banner.jpg", "image/jpeg", new byte[]{1, 2, 3});
    }

    @Test
    void listActive_returnsMappedActiveBanners() {
        when(heroBannerRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc())
                .thenReturn(List.of(banner(1L, 0, true)));

        List<HeroBannerResponse> result = heroBannerService.listActive();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
        assertThat(result.get(0).title()).isEqualTo("Title 1");
        assertThat(result.get(0).active()).isTrue();
    }

    @Test
    void listAll_returnsMappedBanners() {
        when(heroBannerRepository.findAllByOrderByDisplayOrderAscIdAsc())
                .thenReturn(List.of(banner(1L, 0, true), banner(2L, 1, false)));

        List<HeroBannerResponse> result = heroBannerService.listAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(1).active()).isFalse();
    }

    @Test
    void create_uploadsImageAndPersists() {
        when(cloudinaryService.uploadImage(any()))
                .thenReturn(new CloudinaryService.UploadResult("https://cdn/new.jpg", "kamyaabi/hero/new"));
        when(heroBannerRepository.findAllByOrderByDisplayOrderAscIdAsc()).thenReturn(List.of(banner(1L, 4, true)));
        when(heroBannerRepository.save(any())).thenAnswer(inv -> {
            HeroBanner b = inv.getArgument(0);
            b.setId(10L);
            return b;
        });

        HeroBannerRequest request = HeroBannerRequest.builder()
                .title("  New banner  ")
                .subtitle("  ")
                .altText("Alt")
                .linkUrl("/shop")
                .build();

        HeroBannerResponse result = heroBannerService.create(request, image());

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.imageUrl()).isEqualTo("https://cdn/new.jpg");
        assertThat(result.title()).isEqualTo("New banner");
        assertThat(result.subtitle()).isNull();
        assertThat(result.displayOrder()).isEqualTo(5);
        assertThat(result.active()).isTrue();
    }

    @Test
    void create_withExplicitOrderAndInactive_usesProvidedValues() {
        when(cloudinaryService.uploadImage(any()))
                .thenReturn(new CloudinaryService.UploadResult("https://cdn/new.jpg", "pid"));
        when(heroBannerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        HeroBannerRequest request = HeroBannerRequest.builder()
                .title("Banner")
                .displayOrder(7)
                .active(false)
                .build();

        HeroBannerResponse result = heroBannerService.create(request, image());

        assertThat(result.displayOrder()).isEqualTo(7);
        assertThat(result.active()).isFalse();
        verify(heroBannerRepository, never()).findAllByOrderByDisplayOrderAscIdAsc();
    }

    @Test
    void create_withoutImage_throws() {
        HeroBannerRequest request = HeroBannerRequest.builder().title("Banner").build();

        assertThatThrownBy(() -> heroBannerService.create(request, null))
                .isInstanceOf(BadRequestException.class);

        verify(cloudinaryService, never()).uploadImage(any());
    }

    @Test
    void update_replacesImageAndDeletesOldOne() {
        HeroBanner existing = banner(3L, 2, true);
        when(heroBannerRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(cloudinaryService.uploadImage(any()))
                .thenReturn(new CloudinaryService.UploadResult("https://cdn/updated.jpg", "kamyaabi/hero/updated"));
        when(heroBannerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        HeroBannerRequest request = HeroBannerRequest.builder()
                .title("Updated")
                .displayOrder(9)
                .active(false)
                .build();

        HeroBannerResponse result = heroBannerService.update(3L, request, image());

        assertThat(result.title()).isEqualTo("Updated");
        assertThat(result.imageUrl()).isEqualTo("https://cdn/updated.jpg");
        assertThat(result.displayOrder()).isEqualTo(9);
        assertThat(result.active()).isFalse();
        verify(cloudinaryService).deleteImage("kamyaabi/hero/3");
    }

    @Test
    void update_withoutImage_keepsExistingImage() {
        HeroBanner existing = banner(4L, 1, true);
        when(heroBannerRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(heroBannerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        HeroBannerResponse result = heroBannerService.update(4L, HeroBannerRequest.builder().build(), null);

        assertThat(result.imageUrl()).isEqualTo("https://cdn/img4.jpg");
        verify(cloudinaryService, never()).uploadImage(any());
        verify(cloudinaryService, never()).deleteImage(any());
    }

    @Test
    void update_notFound_throws() {
        when(heroBannerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> heroBannerService.update(99L, HeroBannerRequest.builder().build(), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void setActive_updatesFlag() {
        HeroBanner existing = banner(5L, 0, true);
        when(heroBannerRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(heroBannerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        HeroBannerResponse result = heroBannerService.setActive(5L, false);

        assertThat(result.active()).isFalse();
    }

    @Test
    void setActive_notFound_throws() {
        when(heroBannerRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> heroBannerService.setActive(404L, true))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_removesBannerAndCloudinaryImage() {
        HeroBanner existing = banner(6L, 0, true);
        when(heroBannerRepository.findById(6L)).thenReturn(Optional.of(existing));

        heroBannerService.delete(6L);

        verify(heroBannerRepository).delete(existing);
        verify(cloudinaryService).deleteImage("kamyaabi/hero/6");
    }

    @Test
    void delete_withoutPublicId_skipsCloudinary() {
        HeroBanner existing = HeroBanner.builder().id(7L).imageUrl("/assets/local.webp").build();
        when(heroBannerRepository.findById(7L)).thenReturn(Optional.of(existing));

        heroBannerService.delete(7L);

        verify(heroBannerRepository).delete(existing);
        verify(cloudinaryService, never()).deleteImage(any());
    }

    @Test
    void delete_notFound_throws() {
        when(heroBannerRepository.findById(0L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> heroBannerService.delete(0L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void reorder_assignsSequentialDisplayOrder() {
        HeroBanner b1 = banner(1L, 5, true);
        HeroBanner b2 = banner(2L, 3, true);
        when(heroBannerRepository.findById(2L)).thenReturn(Optional.of(b2));
        when(heroBannerRepository.findById(1L)).thenReturn(Optional.of(b1));
        when(heroBannerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(heroBannerRepository.findAllByOrderByDisplayOrderAscIdAsc()).thenReturn(List.of(b2, b1));

        heroBannerService.reorder(List.of(2L, 1L));

        assertThat(b2.getDisplayOrder()).isEqualTo(0);
        assertThat(b1.getDisplayOrder()).isEqualTo(1);
    }

    @Test
    void reorder_empty_throws() {
        assertThatThrownBy(() -> heroBannerService.reorder(List.of()))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void reorder_unknownId_throws() {
        when(heroBannerRepository.findById(123L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> heroBannerService.reorder(List.of(123L)))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
