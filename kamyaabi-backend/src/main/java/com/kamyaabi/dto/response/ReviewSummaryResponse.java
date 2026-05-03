package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record ReviewSummaryResponse(
        Double averageRating,
        long totalReviews,
        long recentBuyersCount
) {
}
