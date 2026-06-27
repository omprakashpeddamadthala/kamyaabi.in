package com.kamyaabi.service;

import com.kamyaabi.dto.response.SettingMetadataResponse;

import java.util.List;
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
    String WHATSAPP_OTP_AUTH_ENABLED = "whatsapp_otp_auth_enabled";
    String CHATMITRA_API_TOKEN = "chatmitra_api_token";
    String CHATMITRA_API_BASE_URL = "chatmitra_api_base_url";
    String CHATMITRA_SENDER_ID = "chatmitra_sender_id";
    String CHATMITRA_OTP_TEMPLATE_ID = "chatmitra_otp_template_id";

    String COUPON_ENABLED = "coupon_enabled";
    String COUPON_MAX_USES_PER_USER = "coupon_max_uses_per_user";
    String COUPON_MAX_USES_PER_USER_PER_DAY = "coupon_max_uses_per_user_per_day";
    String COUPON_MAX_TOTAL_MEMBERS = "coupon_max_total_members";
    String COUPON_DEFAULT_EXPIRY_DAYS = "coupon_default_expiry_days";
    String COUPON_ALLOW_STACKING = "coupon_allow_stacking";

    String AMAZON_STORE_URL = "amazon_store_url";

    int DEFAULT_LOW_STOCK_THRESHOLD = 10;
    boolean DEFAULT_SHOW_BOUGHT_RECENTLY_BADGE = true;
    int DEFAULT_PRODUCTS_PER_PAGE = 8;
    boolean DEFAULT_WHATSAPP_OTP_AUTH_ENABLED = false;
    String DEFAULT_CHATMITRA_API_BASE_URL = "https://backend.chatmitra.com/v2/client";
    String DEFAULT_CHATMITRA_OTP_TEMPLATE_ID = "otp_login";

    boolean DEFAULT_COUPON_ENABLED = true;
    int DEFAULT_COUPON_MAX_USES_PER_USER = 1;
    int DEFAULT_COUPON_MAX_USES_PER_USER_PER_DAY = 1;
    int DEFAULT_COUPON_MAX_TOTAL_MEMBERS = 20;
    int DEFAULT_COUPON_DEFAULT_EXPIRY_DAYS = 30;
    boolean DEFAULT_COUPON_ALLOW_STACKING = false;

    String DEFAULT_AMAZON_STORE_URL = "";

    int getInt(String key, int defaultValue);

    boolean getBoolean(String key, boolean defaultValue);

    String getString(String key, String defaultValue);

    Map<String, String> getAll();

    /**
     * Returns the full settings catalog as metadata (label, description,
     * category, data type, default value, validation rules) combined with each
     * setting's current value, in display order. Drives the dynamic admin
     * settings UI.
     */
    List<SettingMetadataResponse> getAllMetadata();

    Map<String, String> getPublicSettings();

    Map<String, String> updateAll(Map<String, String> updates);
}
