package com.kamyaabi.dto.response;

import lombok.Builder;

import java.util.Map;

@Builder
public record ShiprocketDashboardResponse(
        long totalOrders,
        long shiprocketSyncedOrders,
        long pendingSyncOrders,
        long codOrders,
        long onlineOrders,
        Map<String, Long> ordersByStatus,
        Map<String, Long> shippingStatusBreakdown
) {
}
