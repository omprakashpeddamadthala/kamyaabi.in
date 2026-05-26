package com.kamyaabi.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ShiprocketPropertiesTest {

    @Test
    void isConfigured_bothSet_returnsTrue() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail("test@example.com");
        props.setPassword("password");
        assertThat(props.isConfigured()).isTrue();
    }

    @Test
    void isConfigured_emailNull_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail(null);
        props.setPassword("password");
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_emailBlank_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail("  ");
        props.setPassword("password");
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_passwordNull_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail("test@example.com");
        props.setPassword(null);
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_passwordBlank_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setEmail("test@example.com");
        props.setPassword("  ");
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void defaults_areSet() {
        ShiprocketProperties props = new ShiprocketProperties();
        assertThat(props.getPickupLocation()).isEqualTo("Primary Warehouse");
        assertThat(props.getDefaultWeight()).isEqualTo(0.5);
        assertThat(props.getDefaultLength()).isEqualTo(10);
        assertThat(props.getDefaultBreadth()).isEqualTo(10);
        assertThat(props.getDefaultHeight()).isEqualTo(10);
    }
}
