package com.kamyaabi.service;

import com.kamyaabi.entity.Order;

import java.util.Map;

public interface ShiprocketService {

    boolean isConfigured();

    void syncOrderToShiprocket(Order order);

    void cancelShiprocketOrder(Order order);

    Map<String, Object> trackShipment(String awbNumber);

    void retryFailedOrders();
}
