package com.kamyaabi.service;

import com.kamyaabi.dto.response.AnalyticsResponse;
import com.kamyaabi.dto.response.DashboardStatsResponse;

import java.time.LocalDate;

public interface DashboardService {

    DashboardStatsResponse getStats();

    AnalyticsResponse getAnalytics(LocalDate startDate, LocalDate endDate);
}
