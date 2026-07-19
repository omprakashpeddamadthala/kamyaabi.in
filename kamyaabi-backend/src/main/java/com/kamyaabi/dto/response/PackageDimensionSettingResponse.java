package com.kamyaabi.dto.response;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record PackageDimensionSettingResponse(
        Long id,
        Integer packageWeightGram,
        Integer length,
        Integer breadth,
        Integer height,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
