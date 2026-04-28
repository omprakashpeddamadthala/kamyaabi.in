package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Daily orders + revenue series for the selected date range, plus totals.
 * Buckets are inclusive of both {@code startDate} and {@code endDate} and
 * always include zero-filled days so charts render a continuous axis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private LocalDate startDate;
    private LocalDate endDate;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private List<AnalyticsPointResponse> points;
}
