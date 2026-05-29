package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.HeroBannerRequest;
import com.kamyaabi.dto.response.HeroBannerResponse;
import com.kamyaabi.entity.HeroBanner;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.HeroBannerRepository;
import com.kamyaabi.service.CloudinaryService;
import com.kamyaabi.service.HeroBannerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@Transactional
public class HeroBannerServiceImpl implements HeroBannerService {

    private final HeroBannerRepository heroBannerRepository;
    private final CloudinaryService cloudinaryService;

    public HeroBannerServiceImpl(HeroBannerRepository heroBannerRepository,
                                 CloudinaryService cloudinaryService) {
        this.heroBannerRepository = heroBannerRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HeroBannerResponse> listActive() {
        return heroBannerRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HeroBannerResponse> listAll() {
        return heroBannerRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public HeroBannerResponse create(HeroBannerRequest request, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new BadRequestException("A banner image is required");
        }
        CloudinaryService.UploadResult upload = cloudinaryService.uploadImage(image);
        HeroBanner banner = HeroBanner.builder()
                .imageUrl(upload.secureUrl())
                .publicId(upload.publicId())
                .title(trimToNull(request.title()))
                .subtitle(trimToNull(request.subtitle()))
                .altText(trimToNull(request.altText()))
                .linkUrl(trimToNull(request.linkUrl()))
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : nextDisplayOrder())
                .active(request.active() == null || request.active())
                .build();
        HeroBanner saved = heroBannerRepository.save(banner);
        log.info("Created hero banner id={} order={}", saved.getId(), saved.getDisplayOrder());
        return toResponse(saved);
    }

    @Override
    public HeroBannerResponse update(Long id, HeroBannerRequest request, MultipartFile image) {
        HeroBanner banner = heroBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hero banner not found: " + id));

        if (request.title() != null) banner.setTitle(trimToNull(request.title()));
        if (request.subtitle() != null) banner.setSubtitle(trimToNull(request.subtitle()));
        if (request.altText() != null) banner.setAltText(trimToNull(request.altText()));
        if (request.linkUrl() != null) banner.setLinkUrl(trimToNull(request.linkUrl()));
        if (request.displayOrder() != null) banner.setDisplayOrder(request.displayOrder());
        if (request.active() != null) banner.setActive(request.active());

        if (image != null && !image.isEmpty()) {
            String oldPublicId = banner.getPublicId();
            CloudinaryService.UploadResult upload = cloudinaryService.uploadImage(image);
            banner.setImageUrl(upload.secureUrl());
            banner.setPublicId(upload.publicId());
            if (oldPublicId != null && !oldPublicId.isBlank()) {
                cloudinaryService.deleteImage(oldPublicId);
            }
        }

        HeroBanner saved = heroBannerRepository.save(banner);
        return toResponse(saved);
    }

    @Override
    public HeroBannerResponse setActive(Long id, boolean active) {
        HeroBanner banner = heroBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hero banner not found: " + id));
        banner.setActive(active);
        return toResponse(heroBannerRepository.save(banner));
    }

    @Override
    public void delete(Long id) {
        HeroBanner banner = heroBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hero banner not found: " + id));
        heroBannerRepository.delete(banner);
        if (banner.getPublicId() != null && !banner.getPublicId().isBlank()) {
            cloudinaryService.deleteImage(banner.getPublicId());
        }
        log.info("Deleted hero banner id={}", id);
    }

    @Override
    public List<HeroBannerResponse> reorder(List<Long> orderedIds) {
        if (orderedIds == null || orderedIds.isEmpty()) {
            throw new BadRequestException("Provide the ordered list of banner ids");
        }
        int order = 0;
        for (Long id : orderedIds) {
            HeroBanner banner = heroBannerRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Hero banner not found: " + id));
            banner.setDisplayOrder(order++);
            heroBannerRepository.save(banner);
        }
        return listAll();
    }

    private int nextDisplayOrder() {
        return heroBannerRepository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(HeroBanner::getDisplayOrder)
                .reduce(Integer::max)
                .map(max -> max + 1)
                .orElse(0);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private HeroBannerResponse toResponse(HeroBanner b) {
        return HeroBannerResponse.builder()
                .id(b.getId())
                .imageUrl(b.getImageUrl())
                .title(b.getTitle())
                .subtitle(b.getSubtitle())
                .altText(b.getAltText())
                .linkUrl(b.getLinkUrl())
                .displayOrder(b.getDisplayOrder())
                .active(b.getActive())
                .build();
    }
}
