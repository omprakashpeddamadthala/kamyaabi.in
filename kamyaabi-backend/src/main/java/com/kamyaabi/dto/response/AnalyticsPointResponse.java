package com.kamyaabi.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record AnalyticsPointResponse(
        LocalDate date,
        long orders,
        BigDecimal revenue
) {
}
