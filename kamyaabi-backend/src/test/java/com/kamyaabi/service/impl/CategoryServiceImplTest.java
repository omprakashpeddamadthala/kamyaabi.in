package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.CategoryMapper;
import com.kamyaabi.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock private CategoryRepository categoryRepository;
    @Mock private CategoryMapper categoryMapper;

    @InjectMocks private CategoryServiceImpl categoryService;

    private Category category;
    private CategoryResponse categoryResponse;
    private CategoryRequest categoryRequest;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(1L).name("Cashews").description("Premium cashews").imageUrl("http://img.url").build();
        categoryResponse = CategoryResponse.builder().id(1L).name("Cashews").description("Premium cashews").productCount(0).build();
        categoryRequest = CategoryRequest.builder().name("Cashews").description("Premium cashews").imageUrl("http://img.url").build();
    }

    @Test
    void getAllCategories_shouldReturnList() {
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(categoryMapper.toResponse(category)).thenReturn(categoryResponse);

        List<CategoryResponse> result = categoryService.getAllCategories();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Cashews");
    }

    @Test
    void getCategoryById_existing_shouldReturnCategory() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryMapper.toResponse(category)).thenReturn(categoryResponse);

        CategoryResponse result = categoryService.getCategoryById(1L);

        assertThat(result.getName()).isEqualTo("Cashews");
    }

    @Test
    void getCategoryById_notFound_shouldThrowException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createCategory_shouldReturnCreatedCategory() {
        when(categoryRepository.existsByName("Cashews")).thenReturn(false);
        when(categoryMapper.toEntity(categoryRequest)).thenReturn(category);
        when(categoryRepository.save(category)).thenReturn(category);
        when(categoryMapper.toResponse(category)).thenReturn(categoryResponse);

        CategoryResponse result = categoryService.createCategory(categoryRequest);

        assertThat(result.getName()).isEqualTo("Cashews");
        verify(categoryRepository).save(category);
    }

    @Test
    void createCategory_duplicate_shouldThrowException() {
        when(categoryRepository.existsByName("Cashews")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(categoryRequest))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void updateCategory_shouldReturnUpdatedCategory() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(Category.class))).thenReturn(category);
        when(categoryMapper.toResponse(any(Category.class))).thenReturn(categoryResponse);

        CategoryResponse result = categoryService.updateCategory(1L, categoryRequest);

        assertThat(result.getName()).isEqualTo("Cashews");
    }

    @Test
    void updateCategory_notFound_shouldThrowException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.updateCategory(999L, categoryRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteCategory_shouldDelete() {
        when(categoryRepository.existsById(1L)).thenReturn(true);

        categoryService.deleteCategory(1L);

        verify(categoryRepository).deleteById(1L);
    }

    @Test
    void deleteCategory_notFound_shouldThrowException() {
        when(categoryRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> categoryService.deleteCategory(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
