package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One bucket in the analytics series — one calendar day's orders + revenue.
 * {@code date} is serialized in ISO-8601 {@code yyyy-MM-dd} form so the
 * frontend can format/label it freely.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsPointResponse {
    private LocalDate date;
    private long orders;
    private BigDecimal revenue;
}
