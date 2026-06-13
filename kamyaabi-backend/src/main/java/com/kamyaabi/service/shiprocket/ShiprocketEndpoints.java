package com.kamyaabi.service.shiprocket;

public final class ShiprocketEndpoints {

    public static final String BASE_URL = "https://apiv2.shiprocket.in/v1/external";
    public static final String AUTH_LOGIN = BASE_URL + "/auth/login";
    public static final String CREATE_ORDER = BASE_URL + "/orders/create/adhoc";
    public static final String CANCEL_ORDER = BASE_URL + "/orders/cancel";
    public static final String ASSIGN_AWB = BASE_URL + "/courier/assign/awb";
    public static final String GENERATE_PICKUP = BASE_URL + "/courier/generate/pickup";
    public static final String TRACK_AWB = BASE_URL + "/courier/track/awb/";
    public static final String SERVICEABILITY = BASE_URL + "/courier/serviceability/";
    public static final String SHOW_ORDER = BASE_URL + "/orders/show/";

    private ShiprocketEndpoints() {
    }
}
