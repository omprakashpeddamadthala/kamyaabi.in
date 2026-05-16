package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ProductTagRequest;
import com.kamyaabi.dto.response.ProductTagResponse;
import com.kamyaabi.entity.ProductTag;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.ProductTagRepository;
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
class ProductTagServiceImplTest {

    @Mock private ProductTagRepository tagRepository;

    @InjectMocks private ProductTagServiceImpl tagService;

    private ProductTag tag;

    @BeforeEach
    void setUp() {
        tag = ProductTag.builder().id(1L).name("Organic").slug("organic").build();
    }

    @Test
    void getAllTags_shouldReturnList() {
        when(tagRepository.findAll()).thenReturn(List.of(tag));

        List<ProductTagResponse> result = tagService.getAllTags();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Organic");
    }

    @Test
    void getTagById_shouldReturnTag() {
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));

        ProductTagResponse result = tagService.getTagById(1L);

        assertThat(result.name()).isEqualTo("Organic");
    }

    @Test
    void getTagById_notFound_shouldThrow() {
        when(tagRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.getTagById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createTag_shouldSucceed() {
        ProductTagRequest request = ProductTagRequest.builder().name("Premium").build();
        when(tagRepository.existsByName("Premium")).thenReturn(false);
        when(tagRepository.existsBySlug("premium")).thenReturn(false);
        when(tagRepository.save(any(ProductTag.class))).thenAnswer(inv -> {
            ProductTag t = inv.getArgument(0);
            t.setId(2L);
            return t;
        });

        ProductTagResponse result = tagService.createTag(request);

        assertThat(result.name()).isEqualTo("Premium");
        assertThat(result.slug()).isEqualTo("premium");
    }

    @Test
    void createTag_withCustomSlug_shouldUseIt() {
        ProductTagRequest request = ProductTagRequest.builder()
                .name("Premium").slug("custom-slug").build();
        when(tagRepository.existsByName("Premium")).thenReturn(false);
        when(tagRepository.existsBySlug("custom-slug")).thenReturn(false);
        when(tagRepository.save(any(ProductTag.class))).thenAnswer(inv -> {
            ProductTag t = inv.getArgument(0);
            t.setId(3L);
            return t;
        });

        ProductTagResponse result = tagService.createTag(request);

        assertThat(result.slug()).isEqualTo("custom-slug");
    }

    @Test
    void createTag_duplicateName_shouldThrow() {
        ProductTagRequest request = ProductTagRequest.builder().name("Organic").build();
        when(tagRepository.existsByName("Organic")).thenReturn(true);

        assertThatThrownBy(() -> tagService.createTag(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createTag_duplicateSlug_shouldThrow() {
        ProductTagRequest request = ProductTagRequest.builder().name("Organic2").build();
        when(tagRepository.existsByName("Organic2")).thenReturn(false);
        when(tagRepository.existsBySlug("organic2")).thenReturn(true);

        assertThatThrownBy(() -> tagService.createTag(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void updateTag_shouldUpdateFields() {
        ProductTagRequest request = ProductTagRequest.builder().name("Updated").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(any(ProductTag.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductTagResponse result = tagService.updateTag(1L, request);

        assertThat(result.name()).isEqualTo("Updated");
        assertThat(result.slug()).isEqualTo("updated");
    }

    @Test
    void updateTag_withCustomSlug_shouldUseIt() {
        ProductTagRequest request = ProductTagRequest.builder()
                .name("Updated").slug("my-slug").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(tag));
        when(tagRepository.save(any(ProductTag.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductTagResponse result = tagService.updateTag(1L, request);

        assertThat(result.slug()).isEqualTo("my-slug");
    }

    @Test
    void updateTag_notFound_shouldThrow() {
        ProductTagRequest request = ProductTagRequest.builder().name("X").build();
        when(tagRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.updateTag(999L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTag_shouldDelete() {
        when(tagRepository.existsById(1L)).thenReturn(true);

        tagService.deleteTag(1L);

        verify(tagRepository).deleteById(1L);
    }

    @Test
    void deleteTag_notFound_shouldThrow() {
        when(tagRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> tagService.deleteTag(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void mergeTags_shouldDeleteSourceTag() {
        ProductTag source = ProductTag.builder().id(1L).name("Source").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(source));
        when(tagRepository.existsById(2L)).thenReturn(true);

        tagService.mergeTags(1L, 2L);

        verify(tagRepository).delete(source);
    }

    @Test
    void mergeTags_sameId_shouldDoNothing() {
        tagService.mergeTags(1L, 1L);

        verify(tagRepository, never()).findById(any());
        verify(tagRepository, never()).delete(any());
    }

    @Test
    void mergeTags_sourceNotFound_shouldThrow() {
        when(tagRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.mergeTags(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void mergeTags_targetNotFound_shouldThrow() {
        ProductTag source = ProductTag.builder().id(1L).name("Source").build();
        when(tagRepository.findById(1L)).thenReturn(Optional.of(source));
        when(tagRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> tagService.mergeTags(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
