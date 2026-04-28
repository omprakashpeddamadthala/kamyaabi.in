package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.ReviewResponse;
import com.kamyaabi.dto.response.ReviewSummaryResponse;
import com.kamyaabi.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@Tag(name = "Reviews", description = "Product reviews & rating summary")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    @Operation(summary = "List reviews for a product (paginated, newest first)")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> listReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getReviewsForProduct(productId, pageable)));
    }

    @GetMapping("/summary")
    @Operation(summary = "Aggregated rating + recent-buyer stats for a product")
    public ResponseEntity<ApiResponse<ReviewSummaryResponse>> summary(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getSummaryForProduct(productId)));
    }
}
