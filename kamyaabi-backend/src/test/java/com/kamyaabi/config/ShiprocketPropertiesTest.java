package com.kamyaabi.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ShiprocketPropertiesTest {

    @Test
    void isConfigured_tokenSet_returnsTrue() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken("some-api-token");
        assertThat(props.isConfigured()).isTrue();
    }

    @Test
    void isConfigured_tokenNull_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken(null);
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_tokenBlank_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken("  ");
        assertThat(props.isConfigured()).isFalse();
    }

    @Test
    void isConfigured_tokenEmpty_returnsFalse() {
        ShiprocketProperties props = new ShiprocketProperties();
        props.setApiToken("");
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
