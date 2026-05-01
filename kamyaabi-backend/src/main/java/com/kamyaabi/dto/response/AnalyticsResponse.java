package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

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
