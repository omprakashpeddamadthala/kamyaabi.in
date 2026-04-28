package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Summary metrics surfaced on the admin dashboard header.
 *
 * <p>Counts include soft-deleted products so admins see the true catalog size.
 * {@code totalRevenue} sums {@code totalAmount} across all non-cancelled,
 * non-failed orders.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalProducts;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long lowStockCount;
}
