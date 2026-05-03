package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record DashboardStatsResponse(
        long totalProducts,
        long totalOrders,
        BigDecimal totalRevenue,
        long lowStockCount
) {
}
