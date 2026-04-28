package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.AnalyticsPointResponse;
import com.kamyaabi.dto.response.AnalyticsResponse;
import com.kamyaabi.dto.response.DashboardStatsResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.service.DashboardService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final int LOW_STOCK_THRESHOLD = 10;
    private static final int MAX_ANALYTICS_RANGE_DAYS = 366;

    /** Statuses excluded from revenue / order-count aggregations. */
    private static final List<Order.OrderStatus> NON_REVENUE_STATUSES = List.of(
            Order.OrderStatus.PENDING,
            Order.OrderStatus.CANCELLED,
            Order.OrderStatus.PAYMENT_FAILED);

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public DashboardServiceImpl(ProductRepository productRepository,
                                OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    public DashboardStatsResponse getStats() {
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = orderRepository.sumRevenueExcludingStatuses(NON_REVENUE_STATUSES);
        long lowStock = productRepository.countByActiveTrueAndStockLessThan(LOW_STOCK_THRESHOLD);
        return DashboardStatsResponse.builder()
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue == null ? BigDecimal.ZERO : totalRevenue)
                .lowStockCount(lowStock)
                .build();
    }

    @Override
    public AnalyticsResponse getAnalytics(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        LocalDate start = startDate != null ? startDate : today.minusDays(6);
        LocalDate end = endDate != null ? endDate : today;
        if (end.isBefore(start)) {
            throw new BadRequestException("endDate must be on or after startDate");
        }
        if (start.plusDays(MAX_ANALYTICS_RANGE_DAYS).isBefore(end)) {
            throw new BadRequestException(
                    "Date range too large: max " + MAX_ANALYTICS_RANGE_DAYS + " days");
        }

        // Half-open [fromTs, toTs) so the whole of `end` is included.
        LocalDateTime fromTs = start.atStartOfDay();
        LocalDateTime toTs = end.plusDays(1).atStartOfDay();

        List<Object[]> rows = orderRepository.aggregateDaily(fromTs, toTs, NON_REVENUE_STATUSES);
        Map<LocalDate, AnalyticsPointResponse> byDay = new HashMap<>();
        for (Object[] row : rows) {
            LocalDate day = coerceToLocalDate(row[0]);
            long count = ((Number) row[1]).longValue();
            BigDecimal revenue = row[2] == null ? BigDecimal.ZERO : (BigDecimal) row[2];
            byDay.put(day, AnalyticsPointResponse.builder()
                    .date(day)
                    .orders(count)
                    .revenue(revenue)
                    .build());
        }

        List<AnalyticsPointResponse> points = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrders = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            AnalyticsPointResponse p = byDay.getOrDefault(d,
                    AnalyticsPointResponse.builder()
                            .date(d).orders(0L).revenue(BigDecimal.ZERO).build());
            points.add(p);
            totalOrders += p.getOrders();
            totalRevenue = totalRevenue.add(p.getRevenue());
        }

        return AnalyticsResponse.builder()
                .startDate(start)
                .endDate(end)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .points(points)
                .build();
    }

    /**
     * The aggregate query's first column is expressed as {@code LocalDate} in
     * JPQL but some providers return {@link java.sql.Date}. Normalize both to
     * {@link LocalDate}.
     */
    private static LocalDate coerceToLocalDate(Object raw) {
        if (raw instanceof LocalDate ld) return ld;
        if (raw instanceof java.sql.Date sd) return sd.toLocalDate();
        if (raw instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
        if (raw instanceof LocalDateTime ldt) return ldt.toLocalDate();
        throw new IllegalStateException("Unexpected date type: " + raw.getClass());
    }

    @SuppressWarnings("unused")
    private static LocalDateTime endOfDay(LocalDate date) {
        return LocalDateTime.of(date, LocalTime.MAX);
    }
}
