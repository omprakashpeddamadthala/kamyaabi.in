package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record ShiprocketStatsResponse(
        long totalSynced,
        long syncPending,
        long pickupScheduled,
        long awbAssigned,
        long inTransit,
        long delivered,
        long cancelled,
        long codOrders,
        boolean shiprocketConfigured
) {
}
