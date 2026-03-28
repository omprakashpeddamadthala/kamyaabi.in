package com.kamyaabi.mapper;

import com.kamyaabi.dto.response.PaymentResponse;
import com.kamyaabi.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
