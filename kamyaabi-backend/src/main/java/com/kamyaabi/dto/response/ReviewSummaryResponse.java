package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSummaryResponse {
    /** Mean star rating (0..5). Zero when there are no reviews. */
    private Double averageRating;
    /** Total number of reviews persisted for the product. */
    private long totalReviews;
    /** Distinct purchasers in the trailing 7 days from delivered/paid orders. */
    private long recentBuyersCount;
}
