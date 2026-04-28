package com.kamyaabi.service;

import com.kamyaabi.dto.response.ReviewResponse;
import com.kamyaabi.dto.response.ReviewSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    Page<ReviewResponse> getReviewsForProduct(Long productId, Pageable pageable);

    ReviewSummaryResponse getSummaryForProduct(Long productId);
}
