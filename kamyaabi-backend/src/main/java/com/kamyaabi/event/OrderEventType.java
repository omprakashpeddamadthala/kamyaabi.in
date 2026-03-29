package com.kamyaabi.event;

/**
 * Enum representing the different types of order events that trigger email notifications.
 */
public enum OrderEventType {
    ORDER_PLACED,
    ORDER_CONFIRMED,
    ORDER_PROCESSING,
    ORDER_SHIPPED,
    ORDER_DELIVERED,
    ORDER_CANCELLED,
    ORDER_FAILED
}
