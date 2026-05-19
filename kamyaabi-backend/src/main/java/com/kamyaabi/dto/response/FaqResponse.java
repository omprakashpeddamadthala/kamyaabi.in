package com.kamyaabi.dto.response;

import lombok.Builder;

@Builder
public record FaqResponse(
        Long id,
        String question,
        String answer,
        Integer displayOrder
) {
}
