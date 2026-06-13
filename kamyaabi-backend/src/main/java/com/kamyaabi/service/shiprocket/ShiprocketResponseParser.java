package com.kamyaabi.service.shiprocket;

import java.util.List;
import java.util.Map;

public final class ShiprocketResponseParser {

    private ShiprocketResponseParser() {
    }

    public static String toSafeString(Object value) {
        if (value == null) {
            return null;
        }
        String s = String.valueOf(value).trim();
        return (s.isEmpty() || "null".equalsIgnoreCase(s)) ? null : s;
    }

    public static boolean isPresent(String value) {
        return value != null && !value.isBlank() && !"null".equalsIgnoreCase(value);
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> extractFirstShipment(Map<String, Object> orderData) {
        Object shipmentsRaw = orderData.get("shipments");
        if (shipmentsRaw == null) {
            return null;
        }
        if (shipmentsRaw instanceof List<?> list) {
            return list.isEmpty() ? null : (Map<String, Object>) list.get(0);
        }
        if (shipmentsRaw instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return null;
    }

    public static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "";
        }
        return fullName.trim().split("\\s+", 2)[0];
    }

    public static String lastName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "";
        }
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    public static Integer parseEstimatedDays(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return (int) Math.ceil(Double.parseDouble(String.valueOf(value).trim()));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
