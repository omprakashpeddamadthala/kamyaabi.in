package com.kamyaabi.service.impl;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ParseWeightKgTest {

    @Test
    void parseKg_returnsDirectValue() {
        assertThat(OrderServiceImpl.parseWeightKg("0.5", "kg"))
                .isEqualByComparingTo(new BigDecimal("0.5"));
    }

    @Test
    void parseGrams_convertsToKg() {
        assertThat(OrderServiceImpl.parseWeightKg("500", "g"))
                .isEqualByComparingTo(new BigDecimal("0.500"));
    }

    @Test
    void parseGrams_fullWord() {
        assertThat(OrderServiceImpl.parseWeightKg("250", "grams"))
                .isEqualByComparingTo(new BigDecimal("0.250"));
    }

    @Test
    void nullWeight_returnsNull() {
        assertThat(OrderServiceImpl.parseWeightKg(null, "kg")).isNull();
    }

    @Test
    void blankWeight_returnsNull() {
        assertThat(OrderServiceImpl.parseWeightKg("  ", "g")).isNull();
    }

    @Test
    void invalidNumber_returnsNull() {
        assertThat(OrderServiceImpl.parseWeightKg("abc", "kg")).isNull();
    }

    @Test
    void nullUnit_treatsAsKg() {
        assertThat(OrderServiceImpl.parseWeightKg("1.5", null))
                .isEqualByComparingTo(new BigDecimal("1.5"));
    }
}
