package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.BusinessException;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.CategoryMapper;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.service.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private static final Pattern NON_ALPHANUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGES = Pattern.compile("(^-|-$)");

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories")
    public List<CategoryResponse> getAllCategories() {
        log.debug("Fetching all categories");
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CategoryResponse> getCategoriesPaged(Pageable pageable) {
        log.debug("Fetching paginated categories: {}", pageable);
        return categoryRepository.findAllByOrderByNameAsc(pageable)
                .map(categoryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        log.debug("Fetching category by id: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        return categoryMapper.toResponse(category);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        log.info("Creating new category: {}", request.getName());
        if (categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException(
                    "Category with name '" + request.getName() + "' already exists");
        }
        Category category = categoryMapper.toEntity(request);
        category.setSlug(resolveSlug(request.getSlug(), request.getName(), null));
        applyParent(category, request.getParentId(), null);
        Category saved = categoryRepository.save(category);
        log.info("Category created with id: {}", saved.getId());
        return categoryMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        log.info("Updating category: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));

        if (!category.getName().equalsIgnoreCase(request.getName())
                && categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new DuplicateResourceException(
                    "Category with name '" + request.getName() + "' already exists");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        category.setSlug(resolveSlug(request.getSlug(), request.getName(), id));
        applyParent(category, request.getParentId(), id);

        Category saved = categoryRepository.save(category);
        log.info("Category updated: {}", saved.getId());
        return categoryMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        log.info("Deleting category: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));

        int productCount = category.getProducts() == null ? 0 : category.getProducts().size();
        if (productCount > 0) {
            // 422 — block delete; admin must reassign or remove products first.
            throw new BusinessException(
                    "Cannot delete category '" + category.getName() + "' — "
                            + productCount + " product(s) are assigned. Reassign or remove them first.");
        }
        categoryRepository.delete(category);
        log.info("Category deleted: {}", id);
    }

    /**
     * Resolve the slug to persist. Uses the supplied value when provided
     * (validated by {@code @Pattern} on the request), otherwise generates one
     * from the category name. Always disambiguates against existing rows by
     * appending {@code -2}, {@code -3}, ... when a collision is detected.
     */
    String resolveSlug(String requested, String name, Long currentId) {
        String base = (requested != null && !requested.isBlank())
                ? requested.trim().toLowerCase(Locale.ROOT)
                : slugify(name);
        if (base.isEmpty()) {
            throw new BadRequestException("Unable to derive slug from category name");
        }
        String candidate = base;
        int suffix = 2;
        while (slugTaken(candidate, currentId)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private boolean slugTaken(String slug, Long currentId) {
        return currentId == null
                ? categoryRepository.existsBySlug(slug)
                : categoryRepository.existsBySlugAndIdNot(slug, currentId);
    }

    /**
     * Lowercase, ASCII-fold and hyphenate a category name into a URL-safe slug.
     */
    public static String slugify(String name) {
        if (name == null) return "";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT);
        String dashed = NON_ALPHANUM.matcher(normalized).replaceAll("-");
        return EDGES.matcher(dashed).replaceAll("");
    }

    private void applyParent(Category category, Long parentId, Long currentId) {
        if (parentId == null) {
            category.setParent(null);
            return;
        }
        if (currentId != null && parentId.equals(currentId)) {
            throw new BadRequestException("A category cannot be its own parent");
        }
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent category", parentId));
        // Single-level hierarchy: a parent must itself be top-level.
        if (parent.getParent() != null) {
            throw new BadRequestException(
                    "Parent category '" + parent.getName() + "' is itself a child; only one level of nesting is allowed");
        }
        category.setParent(parent);
    }
}
