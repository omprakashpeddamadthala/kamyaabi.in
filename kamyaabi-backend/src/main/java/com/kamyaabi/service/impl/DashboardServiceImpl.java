package com.kamyaabi.service.impl;

import com.kamyaabi.dto.response.AnalyticsPointResponse;
import com.kamyaabi.dto.response.AnalyticsResponse;
import com.kamyaabi.dto.response.DashboardStatsResponse;
import com.kamyaabi.dto.response.OrderResponse;
import com.kamyaabi.dto.response.ShiprocketDashboardResponse;
import com.kamyaabi.entity.Order;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.mapper.OrderMapper;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.service.DashboardService;
import com.kamyaabi.service.SettingsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final int MAX_ANALYTICS_RANGE_DAYS = 366;

    private static final List<Order.OrderStatus> NON_REVENUE_STATUSES = List.of(
            Order.OrderStatus.PENDING,
            Order.OrderStatus.CANCELLED,
            Order.OrderStatus.PAYMENT_FAILED);

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final SettingsService settingsService;
    private final OrderMapper orderMapper;

    public DashboardServiceImpl(ProductRepository productRepository,
                                OrderRepository orderRepository,
                                SettingsService settingsService,
                                OrderMapper orderMapper) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.settingsService = settingsService;
        this.orderMapper = orderMapper;
    }

    @Override
    public DashboardStatsResponse getStats() {
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = orderRepository.sumRevenueExcludingStatuses(NON_REVENUE_STATUSES);
        int lowStockThreshold = settingsService.getInt(
                SettingsService.LOW_STOCK_THRESHOLD,
                SettingsService.DEFAULT_LOW_STOCK_THRESHOLD);
        long lowStock = productRepository.countByActiveTrueAndStockLessThan(lowStockThreshold);
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
            totalOrders += p.orders();
            totalRevenue = totalRevenue.add(p.revenue());
        }

        return AnalyticsResponse.builder()
                .startDate(start)
                .endDate(end)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .points(points)
                .build();
    }

    @Override
    public ShiprocketDashboardResponse getShiprocketDashboard() {
        long totalOrders = orderRepository.count();
        long syncedOrders = orderRepository.countByShiprocketSyncedTrue();
        long pendingSyncOrders = orderRepository.findByShiprocketSyncedFalseAndStatusIn(
                List.of(Order.OrderStatus.PAID, Order.OrderStatus.CONFIRMED, Order.OrderStatus.PROCESSING)).size();
        long codOrders = orderRepository.countByPaymentMethod(Order.PaymentMethod.COD);
        long onlineOrders = orderRepository.countByPaymentMethod(Order.PaymentMethod.ONLINE);

        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (Object[] row : orderRepository.countShiprocketOrdersByStatusGrouped()) {
            ordersByStatus.put(((Order.OrderStatus) row[0]).name(), (Long) row[1]);
        }

        Map<String, Long> shippingBreakdown = new LinkedHashMap<>();
        for (Object[] row : orderRepository.countByShippingStatusGrouped()) {
            String status = row[0] != null ? row[0].toString() : "UNKNOWN";
            shippingBreakdown.put(status, (Long) row[1]);
        }

        return ShiprocketDashboardResponse.builder()
                .totalOrders(totalOrders)
                .shiprocketSyncedOrders(syncedOrders)
                .pendingSyncOrders(pendingSyncOrders)
                .codOrders(codOrders)
                .onlineOrders(onlineOrders)
                .ordersByStatus(ordersByStatus)
                .shippingStatusBreakdown(shippingBreakdown)
                .build();
    }

    @Override
    public Page<OrderResponse> getShiprocketOrders(Pageable pageable) {
        return orderRepository.findShiprocketOrders(pageable)
                .map(orderMapper::toResponse);
    }

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
