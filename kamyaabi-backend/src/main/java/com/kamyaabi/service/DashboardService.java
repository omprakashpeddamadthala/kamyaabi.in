package com.kamyaabi.service;

import com.kamyaabi.dto.response.AnalyticsResponse;
import com.kamyaabi.dto.response.DashboardStatsResponse;

import java.time.LocalDate;

/**
 * Read-only aggregations that power the admin dashboard summary cards and
 * analytics chart. All methods exclude cancelled / failed / pending orders
 * from revenue and order counts so the numbers reflect realized sales.
 */
public interface DashboardService {

    /** Global stats shown in the four summary cards above the admin tabs. */
    DashboardStatsResponse getStats();

    /**
     * Day-by-day orders + revenue in the inclusive range {@code [startDate, endDate]}.
     * Missing days are zero-filled so the chart renders a continuous axis.
     */
    AnalyticsResponse getAnalytics(LocalDate startDate, LocalDate endDate);
}
