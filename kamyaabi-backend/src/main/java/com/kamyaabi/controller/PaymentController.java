package com.kamyaabi.controller;

import com.kamyaabi.dto.request.PaymentVerifyRequest;
import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.PaymentResponse;
import com.kamyaabi.dto.response.RazorpayOrderResponse;
import com.kamyaabi.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Razorpay payment endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    @Operation(summary = "Create Razorpay order", description = "Create a Razorpay payment order for an order")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createOrder(@RequestParam Long orderId) {
        RazorpayOrderResponse response = paymentService.createRazorpayOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Payment order created", response));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify payment", description = "Verify Razorpay payment signature")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request) {
        PaymentResponse response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }
}
