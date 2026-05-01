package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.AnalyticsResponse;
import com.kamyaabi.dto.response.DashboardStatsResponse;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock private ProductRepository productRepository;
    @Mock private OrderRepository orderRepository;

    @InjectMocks private DashboardServiceImpl dashboardService;

    @Test
    void getStats_shouldAggregateCounts() {
        when(productRepository.count()).thenReturn(25L);
        when(orderRepository.count()).thenReturn(12L);
        when(orderRepository.sumRevenueExcludingStatuses(any()))
                .thenReturn(new BigDecimal("4200.50"));
        when(productRepository.countByActiveTrueAndStockLessThan(10)).thenReturn(3L);

        DashboardStatsResponse result = dashboardService.getStats();

        assertThat(result.getTotalProducts()).isEqualTo(25);
        assertThat(result.getTotalOrders()).isEqualTo(12);
        assertThat(result.getTotalRevenue()).isEqualByComparingTo("4200.50");
        assertThat(result.getLowStockCount()).isEqualTo(3);
    }

    @Test
    void getStats_shouldCoerceNullRevenueToZero() {
        when(productRepository.count()).thenReturn(0L);
        when(orderRepository.count()).thenReturn(0L);
        when(orderRepository.sumRevenueExcludingStatuses(any())).thenReturn(null);
        when(productRepository.countByActiveTrueAndStockLessThan(10)).thenReturn(0L);

        DashboardStatsResponse result = dashboardService.getStats();

        assertThat(result.getTotalRevenue()).isEqualByComparingTo("0");
    }

    @Test
    void getAnalytics_shouldZeroFillMissingDays() {
        LocalDate start = LocalDate.of(2026, 4, 20);
        LocalDate end = LocalDate.of(2026, 4, 23);
        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(new Object[]{Date.valueOf(LocalDate.of(2026, 4, 21)), 2L, new BigDecimal("500.00")});
        when(orderRepository.aggregateDaily(any(), any(), any())).thenReturn(rows);

        AnalyticsResponse result = dashboardService.getAnalytics(start, end);

        assertThat(result.getPoints()).hasSize(4);
        assertThat(result.getPoints().get(0).getOrders()).isZero();
        assertThat(result.getPoints().get(1).getOrders()).isEqualTo(2L);
        assertThat(result.getPoints().get(1).getRevenue()).isEqualByComparingTo("500.00");
        assertThat(result.getPoints().get(2).getOrders()).isZero();
        assertThat(result.getPoints().get(3).getOrders()).isZero();
        assertThat(result.getTotalOrders()).isEqualTo(2);
        assertThat(result.getTotalRevenue()).isEqualByComparingTo("500.00");
    }

    @Test
    void getAnalytics_shouldDefaultToLast7Days_whenNoDatesProvided() {
        when(orderRepository.aggregateDaily(any(), any(), any())).thenReturn(List.of());

        AnalyticsResponse result = dashboardService.getAnalytics(null, null);

        assertThat(result.getPoints()).hasSize(7);
        assertThat(result.getEndDate()).isAfterOrEqualTo(result.getStartDate());
    }

    @Test
    void getAnalytics_shouldRejectInvertedRange() {
        assertThatThrownBy(() -> dashboardService.getAnalytics(
                LocalDate.of(2026, 4, 25), LocalDate.of(2026, 4, 20)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getAnalytics_shouldRejectOversizedRange() {
        assertThatThrownBy(() -> dashboardService.getAnalytics(
                LocalDate.of(2020, 1, 1), LocalDate.of(2026, 1, 1)))
                .isInstanceOf(BadRequestException.class);
    }
}
