package com.kamyaabi.controller;

import com.kamyaabi.dto.request.ReviewRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.ReviewResponse;
import com.kamyaabi.dto.response.ReviewSummaryResponse;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@Tag(name = "Reviews", description = "Product reviews & rating summary")
public class ReviewController {

    private final ReviewService reviewService;
    private final CurrentUser currentUser;

    public ReviewController(ReviewService reviewService, CurrentUser currentUser) {
        this.reviewService = reviewService;
        this.currentUser = currentUser;
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create a review for a product (authenticated users)")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long productId,
            @Valid @RequestPart("review") ReviewRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        Long userId = currentUser.getUserId();
        ReviewResponse response = reviewService.createReview(productId, userId, request, images);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping(value = "/{reviewId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update own review (authenticated users)")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long productId,
            @PathVariable Long reviewId,
            @Valid @RequestPart("review") ReviewRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        Long userId = currentUser.getUserId();
        ReviewResponse response = reviewService.updateReview(reviewId, userId, request, images);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
