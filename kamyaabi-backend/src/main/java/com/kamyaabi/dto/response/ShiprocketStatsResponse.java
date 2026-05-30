package com.kamyaabi.dto.response;

import lombok.Builder;

/**
 * Aggregated counts for the admin Shiprocket dashboard. All values reflect the
 * current state of the {@code orders} table at query time.
 */
@Builder
public record ShiprocketStatsResponse(
        /** Total orders for which Shiprocket sync succeeded (synced == true). */
        long totalSynced,
        /** Orders for which sync is still pending (PAID/CONFIRMED but synced == false). */
        long syncPending,
        /** Orders that have been picked up (a pickup has been scheduled with Shiprocket). */
        long pickupScheduled,
        /** Orders that have an AWB assigned by Shiprocket but have not yet shipped. */
        long awbAssigned,
        /** Orders currently in transit / shipped. */
        long inTransit,
        /** Orders delivered to the customer. */
        long delivered,
        /** Orders cancelled in Shiprocket. */
        long cancelled,
        /** Orders placed as Cash on Delivery (any status). */
        long codOrders,
        /** Whether the Shiprocket integration is currently configured (auth available). */
        boolean shiprocketConfigured
) {
}
