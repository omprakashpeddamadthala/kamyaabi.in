package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.CategoryMapper;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.service.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

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
            throw new DuplicateResourceException("Category with name '" + request.getName() + "' already exists");
        }
        Category category = categoryMapper.toEntity(request);
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
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());
        Category saved = categoryRepository.save(category);
        log.info("Category updated: {}", saved.getId());
        return categoryMapper.toResponse(saved);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        log.info("Deleting category: {}", id);
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", id);
        }
        categoryRepository.deleteById(id);
        log.info("Category deleted: {}", id);
    }
}
