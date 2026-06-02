package com.kamyaabi.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PincodeServiceabilityResponse(
        boolean serviceable,
        String pincode,
        String city,
        String state,
        Integer estimatedDays,
        String courierName,
        String codAvailable,
        String message
) {}
