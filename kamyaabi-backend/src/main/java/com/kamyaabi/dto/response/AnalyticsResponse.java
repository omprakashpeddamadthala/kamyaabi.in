package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record AnalyticsResponse(
        LocalDate startDate,
        LocalDate endDate,
        long totalOrders,
        BigDecimal totalRevenue,
        List<AnalyticsPointResponse> points
) {
}
