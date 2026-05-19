package com.kamyaabi.service.impl;

import com.kamyaabi.dto.request.ReviewRequest;
import com.kamyaabi.dto.response.ReviewResponse;
import com.kamyaabi.dto.response.ReviewSummaryResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.Review;
import com.kamyaabi.entity.User;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.DuplicateResourceException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.exception.UnauthorizedException;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.repository.ReviewRepository;
import com.kamyaabi.repository.UserRepository;
import com.kamyaabi.service.CloudinaryService;
import com.kamyaabi.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private static final List<Order.OrderStatus> NON_PURCHASE_STATUSES = List.of(
            Order.OrderStatus.CANCELLED,
            Order.OrderStatus.PAYMENT_FAILED,
            Order.OrderStatus.PENDING);

    private static final int MAX_REVIEW_IMAGES = 5;

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             OrderRepository orderRepository,
                             ProductRepository productRepository,
                             UserRepository userRepository,
                             CloudinaryService cloudinaryService) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    public Page<ReviewResponse> getReviewsForProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId, pageable)
                .map(this::toResponse);
    }

    @Override
    public ReviewSummaryResponse getSummaryForProduct(Long productId) {
        Double avg = reviewRepository.averageRatingByProductId(productId);
        long total = reviewRepository.countByProductIdAndIsApprovedTrue(productId);
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

    @Override
    @Transactional
    public ReviewResponse createReview(Long productId, Long userId, ReviewRequest request, List<MultipartFile> images) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new DuplicateResourceException("You have already reviewed this product");
        }

        List<String> imageUrls = uploadImages(images);

        Review review = Review.builder()
                .product(product)
                .user(user)
                .authorName(user.getName())
                .title(request.title())
                .rating(request.rating())
                .text(request.text())
                .isApproved(true)
                .build();
        review.setImages(imageUrls);

        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long reviewId, Long userId, ReviewRequest request, List<MultipartFile> images) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (review.getUser() == null || !review.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only edit your own review");
        }

        review.setTitle(request.title());
        review.setRating(request.rating());
        review.setText(request.text());

        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = uploadImages(images);
            review.setImages(imageUrls);
        }

        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId) {
        if (!reviewRepository.existsById(reviewId)) {
            throw new ResourceNotFoundException("Review not found");
        }
        reviewRepository.deleteById(reviewId);
    }

    @Override
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    private List<String> uploadImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) return new ArrayList<>();
        if (images.size() > MAX_REVIEW_IMAGES) {
            throw new BadRequestException("Maximum " + MAX_REVIEW_IMAGES + " images allowed");
        }
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : images) {
            if (file != null && !file.isEmpty()) {
                CloudinaryService.UploadResult result = cloudinaryService.uploadImage(file);
                urls.add(result.secureUrl());
            }
        }
        return urls;
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .authorName(review.getAuthorName())
                .title(review.getTitle())
                .rating(review.getRating())
                .text(review.getText())
                .images(review.getImages())
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
