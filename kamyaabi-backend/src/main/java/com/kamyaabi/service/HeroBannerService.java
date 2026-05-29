package com.kamyaabi.service;

import com.kamyaabi.dto.request.HeroBannerRequest;
import com.kamyaabi.dto.response.HeroBannerResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Manages admin-controlled homepage hero banners (images shown in the storefront
 * hero slider). Images are stored in Cloudinary; metadata (title, order, active,
 * link) lives in the {@code hero_banners} table.
 */
public interface HeroBannerService {

    /** Active banners ordered for public display on the homepage. */
    List<HeroBannerResponse> listActive();

    /** All banners (active + inactive) ordered for the admin panel. */
    List<HeroBannerResponse> listAll();

    HeroBannerResponse create(HeroBannerRequest request, MultipartFile image);

    /** Updates metadata; optionally replaces the image if {@code image} is non-null. */
    HeroBannerResponse update(Long id, HeroBannerRequest request, MultipartFile image);

    HeroBannerResponse setActive(Long id, boolean active);

    void delete(Long id);

    /** Persists a new ordering given the banner ids in their desired order. */
    List<HeroBannerResponse> reorder(List<Long> orderedIds);
}
