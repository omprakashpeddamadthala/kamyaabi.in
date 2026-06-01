package com.kamyaabi.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicOrderTrackingResponse {
    private Long orderId;
    private String orderStatus;
    private String shippingStatus;
    private String awbNumber;
    private String courierName;
    private String placedAt;
    private String deliveredAt;
    private Map<String, Object> trackingData;
}
