package com.kamyaabi.service;

import com.kamyaabi.dto.request.ProductTagRequest;
import com.kamyaabi.dto.response.ProductTagResponse;

import java.util.List;

public interface ProductTagService {

    List<ProductTagResponse> getAllTags();

    ProductTagResponse getTagById(Long id);

    ProductTagResponse createTag(ProductTagRequest request);

    ProductTagResponse updateTag(Long id, ProductTagRequest request);

    void deleteTag(Long id);

    void mergeTags(Long sourceId, Long targetId);
}
