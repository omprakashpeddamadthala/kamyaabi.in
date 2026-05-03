package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.CategoryRequest;
import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.BusinessException;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.mapper.CategoryMapper;
import com.kamyaabi.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
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
        assertThat(result.get(0).name()).isEqualTo("Cashews");
    }

    @Test
    void getCategoryById_existing_shouldReturnCategory() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryMapper.toResponse(category)).thenReturn(categoryResponse);

        CategoryResponse result = categoryService.getCategoryById(1L);

        assertThat(result.name()).isEqualTo("Cashews");
    }

    @Test
    void getCategoryById_notFound_shouldThrowException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createCategory_shouldAutoGenerateSlugFromName() {
        when(categoryRepository.existsByName("Cashews")).thenReturn(false);
        when(categoryRepository.existsBySlug("cashews")).thenReturn(false);
        when(categoryMapper.toEntity(categoryRequest)).thenReturn(category);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));
        when(categoryMapper.toResponse(any(Category.class))).thenReturn(categoryResponse);

        categoryService.createCategory(categoryRequest);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(captor.capture());
        assertThat(captor.getValue().getSlug()).isEqualTo("cashews");
    }

    @Test
    void createCategory_slugCollision_appendsSuffix() {
        when(categoryRepository.existsByName("Cashews")).thenReturn(false);
        when(categoryRepository.existsBySlug("cashews")).thenReturn(true);
        when(categoryRepository.existsBySlug("cashews-2")).thenReturn(false);
        when(categoryMapper.toEntity(any(CategoryRequest.class))).thenReturn(category);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));
        when(categoryMapper.toResponse(any(Category.class))).thenReturn(categoryResponse);

        categoryService.createCategory(categoryRequest);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(captor.capture());
        assertThat(captor.getValue().getSlug()).isEqualTo("cashews-2");
    }

    @Test
    void createCategory_withParent_attachesParent() {
        Category parent = Category.builder().id(2L).name("Dry Fruits").slug("dry-fruits").build();
        CategoryRequest req = CategoryRequest.builder().name("Cashews").parentId(2L).build();
        when(categoryRepository.existsByName("Cashews")).thenReturn(false);
        when(categoryRepository.existsBySlug("cashews")).thenReturn(false);
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(parent));
        when(categoryMapper.toEntity(any(CategoryRequest.class))).thenReturn(category);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));
        when(categoryMapper.toResponse(any(Category.class))).thenReturn(categoryResponse);

        categoryService.createCategory(req);

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(categoryRepository).save(captor.capture());
        assertThat(captor.getValue().getParent()).isSameAs(parent);
    }

    @Test
    void createCategory_parentIsChild_throwsBadRequest() {
        Category grand = Category.builder().id(3L).name("Foods").build();
        Category parent = Category.builder().id(2L).name("Dry Fruits").parent(grand).build();
        CategoryRequest req = CategoryRequest.builder().name("Cashews").parentId(2L).build();
        when(categoryRepository.existsByName("Cashews")).thenReturn(false);
        when(categoryRepository.existsBySlug("cashews")).thenReturn(false);
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(parent));
        when(categoryMapper.toEntity(any(CategoryRequest.class))).thenReturn(category);

        assertThatThrownBy(() -> categoryService.createCategory(req))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void createCategory_duplicate_shouldThrowException() {
        when(categoryRepository.existsByName("Cashews")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(categoryRequest))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void updateCategory_shouldReturnUpdatedCategory() {
        Category existing = Category.builder().id(1L).name("OldName").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.existsByNameAndIdNot("Cashews", 1L)).thenReturn(false);
        when(categoryRepository.existsBySlugAndIdNot(any(), eq(1L))).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(existing);
        when(categoryMapper.toResponse(any(Category.class))).thenReturn(categoryResponse);

        CategoryResponse result = categoryService.updateCategory(1L, categoryRequest);

        assertThat(result.name()).isEqualTo("Cashews");
    }

    @Test
    void updateCategory_cannotBeOwnParent() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.existsBySlugAndIdNot(any(), eq(1L))).thenReturn(false);
        CategoryRequest req = CategoryRequest.builder().name("Cashews").parentId(1L).build();

        assertThatThrownBy(() -> categoryService.updateCategory(1L, req))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateCategory_notFound_shouldThrowException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.updateCategory(999L, categoryRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteCategory_emptyCategory_shouldDelete() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        categoryService.deleteCategory(1L);

        verify(categoryRepository).delete(category);
    }

    @Test
    void deleteCategory_withProducts_throwsBusinessException() {
        Category withProducts = Category.builder().id(1L).name("Cashews").build();
        withProducts.setProducts(List.of(Product.builder().id(7L).build()));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(withProducts));

        assertThatThrownBy(() -> categoryService.deleteCategory(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("1 product");
        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    void deleteCategory_notFound_shouldThrowException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.deleteCategory(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void slugify_handlesUnicodeAndPunctuation() {
        assertThat(CategoryServiceImpl.slugify("Crème Brûlée!")).isEqualTo("creme-brulee");
        assertThat(CategoryServiceImpl.slugify("  Hello   World  ")).isEqualTo("hello-world");
    }
}
