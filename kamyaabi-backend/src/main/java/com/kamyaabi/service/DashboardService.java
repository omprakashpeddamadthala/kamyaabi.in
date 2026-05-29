package com.kamyaabi.service;

import com.kamyaabi.dto.response.AnalyticsResponse;
import com.kamyaabi.dto.response.DashboardStatsResponse;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.dto.response.ShiprocketDashboardResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface DashboardService {

    DashboardStatsResponse getStats();

    AnalyticsResponse getAnalytics(LocalDate startDate, LocalDate endDate);

    ShiprocketDashboardResponse getShiprocketDashboard();

    Page<OrderResponse> getShiprocketOrders(Pageable pageable);
}
