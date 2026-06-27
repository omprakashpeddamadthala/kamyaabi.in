package com.kamyaabi.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.kamyaabi.service.SettingsService.*;

/**
 * Single source of truth for the catalog of admin-tunable platform settings:
 * their labels, descriptions, categories, data types, defaults and validation
 * rules. The admin settings UI is rendered entirely from this metadata so new
 * settings can be added here (plus a value/validation rule) without touching the
 * frontend.
 *
 * <p>Definitions are listed in the order they should appear in the UI, grouped
 * by {@code category}.
 */
public final class SettingsCatalog {

    public static final String CATEGORY_PLATFORM = "Platform";
    public static final String CATEGORY_WHATSAPP = "WhatsApp";
    public static final String CATEGORY_COUPONS = "Coupons";
    public static final String CATEGORY_AMAZON = "Amazon";

    public static final List<SettingDefinition> DEFINITIONS = List.of(
            // ── Platform ──────────────────────────────────────────────
            SettingDefinition.builder()
                    .key(LOW_STOCK_THRESHOLD)
                    .label("Low Stock Alert Threshold")
                    .description("Products with stock below this number are flagged as low stock on the dashboard.")
                    .helperText("Default: " + DEFAULT_LOW_STOCK_THRESHOLD)
                    .category(CATEGORY_PLATFORM)
                    .dataType(SettingDataType.NUMBER)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_LOW_STOCK_THRESHOLD))
                    .min(1)
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(PRODUCTS_PER_PAGE)
                    .label("Products Per Page")
                    .description("Default page size on the public product listing page.")
                    .helperText("Default: " + DEFAULT_PRODUCTS_PER_PAGE)
                    .category(CATEGORY_PLATFORM)
                    .dataType(SettingDataType.NUMBER)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_PRODUCTS_PER_PAGE))
                    .min(1)
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(SHOW_BOUGHT_RECENTLY_BADGE)
                    .label("Bought Recently Badge")
                    .description("When enabled, product detail pages show a \"X people bought this in the last 7 days\" badge.")
                    .category(CATEGORY_PLATFORM)
                    .dataType(SettingDataType.BOOLEAN)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_SHOW_BOUGHT_RECENTLY_BADGE))
                    .required(true)
                    .build(),

            // ── WhatsApp ──────────────────────────────────────────────
            SettingDefinition.builder()
                    .key(WHATSAPP_OTP_AUTH_ENABLED)
                    .label("WhatsApp OTP Login")
                    .description("Show the WhatsApp login option on the public sign-in page and allow the backend OTP endpoints to accept requests.")
                    .category(CATEGORY_WHATSAPP)
                    .dataType(SettingDataType.BOOLEAN)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_WHATSAPP_OTP_AUTH_ENABLED))
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(CHATMITRA_API_TOKEN)
                    .label("ChatMitra API Token")
                    .description("Required to send the OTP template through ChatMitra. Stored for backend use only.")
                    .helperText("Leave blank only if the backend should keep using the env fallback.")
                    .category(CATEGORY_WHATSAPP)
                    .dataType(SettingDataType.SECRET)
                    .editable(true)
                    .defaultValue("")
                    .required(false)
                    .build(),
            SettingDefinition.builder()
                    .key(CHATMITRA_API_BASE_URL)
                    .label("ChatMitra API Base URL")
                    .description("Base URL for the ChatMitra API. Leave blank to use the backend default.")
                    .helperText("Must start with http:// or https://")
                    .category(CATEGORY_WHATSAPP)
                    .dataType(SettingDataType.URL)
                    .editable(true)
                    .defaultValue(DEFAULT_CHATMITRA_API_BASE_URL)
                    .required(false)
                    .build(),
            SettingDefinition.builder()
                    .key(CHATMITRA_SENDER_ID)
                    .label("ChatMitra Sender ID")
                    .description("WhatsApp sender ID, if required by your ChatMitra account.")
                    .helperText("Optional")
                    .category(CATEGORY_WHATSAPP)
                    .dataType(SettingDataType.STRING)
                    .editable(true)
                    .defaultValue("")
                    .required(false)
                    .build(),
            SettingDefinition.builder()
                    .key(CHATMITRA_OTP_TEMPLATE_ID)
                    .label("ChatMitra OTP Template ID")
                    .description("Approved WhatsApp message template used to deliver the OTP.")
                    .helperText("Defaults to " + DEFAULT_CHATMITRA_OTP_TEMPLATE_ID)
                    .category(CATEGORY_WHATSAPP)
                    .dataType(SettingDataType.STRING)
                    .editable(true)
                    .defaultValue(DEFAULT_CHATMITRA_OTP_TEMPLATE_ID)
                    .required(false)
                    .build(),

            // ── Coupons ───────────────────────────────────────────────
            SettingDefinition.builder()
                    .key(COUPON_ENABLED)
                    .label("Enable Coupon System")
                    .description("Master switch \u2014 disables all coupon input if off.")
                    .category(CATEGORY_COUPONS)
                    .dataType(SettingDataType.BOOLEAN)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_COUPON_ENABLED))
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(COUPON_MAX_USES_PER_USER)
                    .label("Max Uses Per User")
                    .description("How many times one user can use any single coupon.")
                    .helperText("Default: " + DEFAULT_COUPON_MAX_USES_PER_USER)
                    .category(CATEGORY_COUPONS)
                    .dataType(SettingDataType.NUMBER)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_COUPON_MAX_USES_PER_USER))
                    .min(1)
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(COUPON_MAX_USES_PER_USER_PER_DAY)
                    .label("Max Uses Per User Per Day")
                    .description("Daily usage cap per user per coupon.")
                    .helperText("Default: " + DEFAULT_COUPON_MAX_USES_PER_USER_PER_DAY)
                    .category(CATEGORY_COUPONS)
                    .dataType(SettingDataType.NUMBER)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_COUPON_MAX_USES_PER_USER_PER_DAY))
                    .min(1)
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(COUPON_MAX_TOTAL_MEMBERS)
                    .label("Max Total Members Per Coupon")
                    .description("Hard cap on unique users who can redeem a coupon.")
                    .helperText("Default: " + DEFAULT_COUPON_MAX_TOTAL_MEMBERS)
                    .category(CATEGORY_COUPONS)
                    .dataType(SettingDataType.NUMBER)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_COUPON_MAX_TOTAL_MEMBERS))
                    .min(1)
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(COUPON_DEFAULT_EXPIRY_DAYS)
                    .label("Default Coupon Expiry (Days)")
                    .description("Pre-fills expiry when creating new coupons.")
                    .helperText("Default: " + DEFAULT_COUPON_DEFAULT_EXPIRY_DAYS)
                    .category(CATEGORY_COUPONS)
                    .dataType(SettingDataType.NUMBER)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_COUPON_DEFAULT_EXPIRY_DAYS))
                    .min(1)
                    .required(true)
                    .build(),
            SettingDefinition.builder()
                    .key(COUPON_ALLOW_STACKING)
                    .label("Allow Multiple Coupons")
                    .description("Whether users can apply more than one coupon per order.")
                    .category(CATEGORY_COUPONS)
                    .dataType(SettingDataType.BOOLEAN)
                    .editable(true)
                    .defaultValue(String.valueOf(DEFAULT_COUPON_ALLOW_STACKING))
                    .required(true)
                    .build(),

            // ── Amazon ────────────────────────────────────────────────
            SettingDefinition.builder()
                    .key(AMAZON_STORE_URL)
                    .label("Amazon Store URL")
                    .description("URL used by the \"Also Available on Amazon\" banners on product pages and the \"Find Us on Amazon\" section on the homepage. Leave blank to hide these banners.")
                    .helperText("Full Amazon store or product/search URL")
                    .category(CATEGORY_AMAZON)
                    .dataType(SettingDataType.URL)
                    .editable(true)
                    .defaultValue(DEFAULT_AMAZON_STORE_URL)
                    .required(false)
                    .build());

    public static final Map<String, SettingDefinition> BY_KEY = DEFINITIONS.stream()
            .collect(Collectors.toMap(
                    SettingDefinition::key,
                    Function.identity(),
                    (a, b) -> a,
                    LinkedHashMap::new));

    private SettingsCatalog() {
    }
}
