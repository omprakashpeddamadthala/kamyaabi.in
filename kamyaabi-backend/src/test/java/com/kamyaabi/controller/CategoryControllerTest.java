package com.kamyaabi.controller;

import com.kamyaabi.dto.response.CategoryResponse;
import com.kamyaabi.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock private CategoryService categoryService;

    @InjectMocks private CategoryController categoryController;

    @Test
    void getAllCategories_shouldReturnList() {
        CategoryResponse categoryResponse = CategoryResponse.builder().id(1L).name("Cashews").build();
        when(categoryService.getAllCategories()).thenReturn(List.of(categoryResponse));

        ResponseEntity<?> response = categoryController.getAllCategories();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void getCategoryById_shouldReturnCategory() {
        CategoryResponse categoryResponse = CategoryResponse.builder().id(1L).name("Cashews").build();
        when(categoryService.getCategoryById(1L)).thenReturn(categoryResponse);

        ResponseEntity<?> response = categoryController.getCategoryById(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }
}
