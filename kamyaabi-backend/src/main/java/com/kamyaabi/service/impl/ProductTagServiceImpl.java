package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProductTagRequest;
import com.kamyaabi.dto.response.ProductTagResponse;
import com.kamyaabi.entity.ProductTag;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.ProductTagRepository;
import com.kamyaabi.service.ProductTagService;
import com.kamyaabi.util.Slugifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProductTagServiceImpl implements ProductTagService {

    private final ProductTagRepository tagRepository;

    public ProductTagServiceImpl(ProductTagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductTagResponse> getAllTags() {
        return tagRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductTagResponse getTagById(Long id) {
        ProductTag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product tag not found"));
        return toResponse(tag);
    }

    @Override
    @Transactional
    public ProductTagResponse createTag(ProductTagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new DuplicateResourceException("Product tag with this name already exists");
        }
        String slug = (request.slug() != null && !request.slug().isBlank())
                ? Slugifier.slugify(request.slug())
                : Slugifier.slugify(request.name());
        if (tagRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Product tag slug already exists: " + slug);
        }
        ProductTag tag = ProductTag.builder()
                .name(request.name())
                .slug(slug)
                .build();
        return toResponse(tagRepository.save(tag));
    }

    @Override
    @Transactional
    public ProductTagResponse updateTag(Long id, ProductTagRequest request) {
        ProductTag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product tag not found"));
        tag.setName(request.name());
        String slug = (request.slug() != null && !request.slug().isBlank())
                ? Slugifier.slugify(request.slug())
                : Slugifier.slugify(request.name());
        tag.setSlug(slug);
        return toResponse(tagRepository.save(tag));
    }

    @Override
    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product tag not found");
        }
        tagRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void mergeTags(Long sourceId, Long targetId) {
        if (sourceId.equals(targetId)) {
            return;
        }
        ProductTag source = tagRepository.findById(sourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Source tag not found"));
        if (!tagRepository.existsById(targetId)) {
            throw new ResourceNotFoundException("Target tag not found");
        }
        tagRepository.delete(source);
        log.info("Merged product tag {} into {}", sourceId, targetId);
    }

    private ProductTagResponse toResponse(ProductTag tag) {
        return ProductTagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .slug(tag.getSlug())
                .createdAt(tag.getCreatedAt())
                .build();
    }
}
