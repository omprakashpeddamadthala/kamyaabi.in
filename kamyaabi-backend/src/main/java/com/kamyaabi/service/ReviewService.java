package com.kamyaabi.service;

import com.kamyaabi.dto.request.ReviewRequest;
import com.kamyaabi.dto.response.ReviewResponse;
import com.kamyaabi.dto.response.ReviewSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ReviewService {

    Page<ReviewResponse> getReviewsForProduct(Long productId, Pageable pageable);

    ReviewSummaryResponse getSummaryForProduct(Long productId);

    ReviewResponse createReview(Long productId, Long userId, ReviewRequest request, List<MultipartFile> images);

    ReviewResponse updateReview(Long reviewId, Long userId, ReviewRequest request, List<MultipartFile> images);

    void deleteReview(Long reviewId);

    Page<ReviewResponse> getAllReviews(Pageable pageable);
}
