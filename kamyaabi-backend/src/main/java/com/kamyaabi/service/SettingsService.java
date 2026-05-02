package com.kamyaabi.service;

import java.util.Map;

/**
 * Read/write access to runtime-tunable platform settings (key/value pairs
 * persisted in the {@code settings} table).
 *
 * <p>Settings drive low-stock alert thresholds, product-listing page size,
 * and conditional UI features (e.g. the "X bought this in last 7 days" badge).
 * Defaults are applied per-key when a row is missing or the stored value
 * fails type coercion.
 */
public interface SettingsService {

    String LOW_STOCK_THRESHOLD = "low_stock_threshold";
    String SHOW_BOUGHT_RECENTLY_BADGE = "show_bought_recently_badge";
    String PRODUCTS_PER_PAGE = "products_per_page";

    int DEFAULT_LOW_STOCK_THRESHOLD = 10;
    boolean DEFAULT_SHOW_BOUGHT_RECENTLY_BADGE = true;
    int DEFAULT_PRODUCTS_PER_PAGE = 8;

    int getInt(String key, int defaultValue);

    boolean getBoolean(String key, boolean defaultValue);

    Map<String, String> getAll();

    Map<String, String> getPublicSettings();

    Map<String, String> updateAll(Map<String, String> updates);
}
