package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.ReviewResponse;
import com.kamyaabi.dto.response.ReviewSummaryResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.Review;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.ReviewRepository;
import com.kamyaabi.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private static final List<Order.OrderStatus> NON_PURCHASE_STATUSES = List.of(
            Order.OrderStatus.CANCELLED,
            Order.OrderStatus.PAYMENT_FAILED,
            Order.OrderStatus.PENDING);

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository, OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public Page<ReviewResponse> getReviewsForProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(this::toResponse);
    }

    @Override
    public ReviewSummaryResponse getSummaryForProduct(Long productId) {
        Double avg = reviewRepository.averageRatingByProductId(productId);
        long total = reviewRepository.countByProductId(productId);
        long recent = orderRepository.countDistinctRecentBuyersForProduct(
                productId,
                LocalDateTime.now().minusDays(7),
                NON_PURCHASE_STATUSES);
        return ReviewSummaryResponse.builder()
                .averageRating(avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0)
                .totalReviews(total)
                .recentBuyersCount(recent)
                .build();
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .authorName(review.getAuthorName())
                .rating(review.getRating())
                .text(review.getText())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
