package com.kamyaabi.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsPointResponse {
    private LocalDate date;
    private long orders;
    private BigDecimal revenue;
}
