package com.kamyaabi.controller;

import com.kamyaabi.dto.response.ApiResponse;
import com.kamyaabi.dto.response.PincodeServiceabilityResponse;
import com.kamyaabi.entity.Product;
import com.kamyaabi.exception.BadRequestException;
import com.kamyaabi.exception.ResourceNotFoundException;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.security.CurrentUser;
import com.kamyaabi.service.DeliveryEstimateService;
import com.kamyaabi.service.ShiprocketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/delivery")
@Tag(name = "Delivery", description = "Delivery estimate endpoints (authenticated)")
public class DeliveryController {

    private final ShiprocketService shiprocketService;
    private final ProductRepository productRepository;
    private final DeliveryEstimateService deliveryEstimateService;
    private final CurrentUser currentUser;

    public DeliveryController(ShiprocketService shiprocketService,
                              ProductRepository productRepository,
                              DeliveryEstimateService deliveryEstimateService,
                              CurrentUser currentUser) {
        this.shiprocketService = shiprocketService;
        this.productRepository = productRepository;
        this.deliveryEstimateService = deliveryEstimateService;
        this.currentUser = currentUser;
    }

    @GetMapping("/estimate")
    @Operation(summary = "Get delivery estimate",
            description = "Returns estimated delivery days for the given pincode and product. Authenticated users only.")
    public ResponseEntity<ApiResponse<PincodeServiceabilityResponse>> getDeliveryEstimate(
            @RequestParam String pincode,
            @RequestParam Long productId) {

        if (pincode == null || !pincode.matches("^[1-9][0-9]{5}$")) {
            throw new BadRequestException("Please enter a valid 6-digit pincode");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        double weightKg = parseWeightToKg(product.getWeight(), product.getUnit());

        PincodeServiceabilityResponse response = shiprocketService.checkServiceability(pincode, weightKg);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/cached-estimate")
    @Operation(summary = "Get cached delivery estimate",
            description = "Returns the cached Shiprocket delivery estimate for the current user from the database. "
                    + "Returns 204 No Content if no estimate has been computed yet.")
    public ResponseEntity<ApiResponse<PincodeServiceabilityResponse>> getCachedEstimate() {
        Long userId = currentUser.getUserId();
        return deliveryEstimateService.getCachedEstimate(userId)
                .map(est -> ResponseEntity.ok(ApiResponse.success(est)))
                .orElse(ResponseEntity.noContent().build());
    }

    private double parseWeightToKg(String weight, String unit) {
        if (weight == null || weight.isBlank()) {
            return 0.5;
        }
        try {
            double numericWeight = Double.parseDouble(weight.replaceAll("[^\\d.]", ""));
            String normalizedUnit = (unit != null) ? unit.toLowerCase().trim() : "";
            if (normalizedUnit.startsWith("kg")) {
                return numericWeight;
            }
            // Default to grams
            return numericWeight / 1000.0;
        } catch (NumberFormatException e) {
            return 0.5;
        }
    }
}
