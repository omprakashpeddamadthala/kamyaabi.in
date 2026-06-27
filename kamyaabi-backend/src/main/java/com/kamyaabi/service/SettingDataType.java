package com.kamyaabi.service;

/**
 * Logical data type of a platform setting. Drives the input control the admin
 * UI renders for each setting (text field, number input, toggle, masked secret,
 * URL field, JSON editor) and the client-side validation applied to its value.
 */
public enum SettingDataType {
    STRING,
    NUMBER,
    BOOLEAN,
    SECRET,
    URL,
    JSON
}
