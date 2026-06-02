package com.kamyaabi.service;

import com.kamyaabi.dto.response.PincodeServiceabilityResponse;
import com.kamyaabi.entity.Order;

import java.util.Map;

public interface ShiprocketService {

    boolean isConfigured();

    void syncOrderToShiprocket(Order order);

    void cancelShiprocketOrder(Order order);

    Map<String, Object> trackShipment(String awbNumber);

    void retryFailedOrders();

    PincodeServiceabilityResponse checkServiceability(String pincode, double weight);
}
