package com.kamyaabi.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class IndianAddressValidatorTest {

    private IndianAddressValidator validator;

    @BeforeEach
    void setUp() {
        validator = new IndianAddressValidator();
    }

    @Test
    void isValidState_validState_shouldReturnTrue() {
        assertThat(validator.isValidState("Karnataka")).isTrue();
        assertThat(validator.isValidState("Maharashtra")).isTrue();
        assertThat(validator.isValidState("Tamil Nadu")).isTrue();
        assertThat(validator.isValidState("Delhi")).isTrue();
    }

    @Test
    void isValidState_invalidState_shouldReturnFalse() {
        assertThat(validator.isValidState("InvalidState")).isFalse();
        assertThat(validator.isValidState("")).isFalse();
        assertThat(validator.isValidState(null)).isFalse();
    }

    @Test
    void isValidCityForState_validCityForState_shouldReturnTrue() {
        assertThat(validator.isValidCityForState("Karnataka", "Bengaluru")).isTrue();
        assertThat(validator.isValidCityForState("Maharashtra", "Mumbai")).isTrue();
        assertThat(validator.isValidCityForState("Delhi", "New Delhi")).isTrue();
    }

    @Test
    void isValidCityForState_invalidCityForState_shouldReturnFalse() {
        assertThat(validator.isValidCityForState("Karnataka", "Mumbai")).isFalse();
        assertThat(validator.isValidCityForState("Maharashtra", "Bengaluru")).isFalse();
    }

    @Test
    void isValidCityForState_invalidState_shouldReturnFalse() {
        assertThat(validator.isValidCityForState("InvalidState", "SomeCity")).isFalse();
        assertThat(validator.isValidCityForState(null, "SomeCity")).isFalse();
    }

    @Test
    void getStates_shouldReturnAllStates() {
        List<String> states = validator.getStates();

        assertThat(states).isNotEmpty();
        assertThat(states).contains("Karnataka", "Maharashtra", "Tamil Nadu", "Delhi");
        assertThat(states).contains("Andaman and Nicobar Islands", "Chandigarh", "Ladakh");
    }

    @Test
    void getCitiesForState_validState_shouldReturnCities() {
        List<String> cities = validator.getCitiesForState("Karnataka");

        assertThat(cities).isNotEmpty();
        assertThat(cities).contains("Bengaluru", "Mysuru", "Mangaluru");
    }

    @Test
    void getCitiesForState_invalidState_shouldReturnEmptyList() {
        List<String> cities = validator.getCitiesForState("InvalidState");

        assertThat(cities).isEmpty();
    }

    @Test
    void getCitiesForState_nullState_shouldReturnEmptyList() {
        List<String> cities = validator.getCitiesForState(null);

        assertThat(cities).isEmpty();
    }

    @Test
    void allStatesHaveCities() {
        List<String> states = validator.getStates();
        for (String state : states) {
            List<String> cities = validator.getCitiesForState(state);
            assertThat(cities).as("State '%s' should have cities", state).isNotEmpty();
        }
    }

    @Test
    void unionTerritoriesIncluded() {
        assertThat(validator.isValidState("Chandigarh")).isTrue();
        assertThat(validator.isValidState("Puducherry")).isTrue();
        assertThat(validator.isValidState("Lakshadweep")).isTrue();
        assertThat(validator.isValidState("Dadra and Nagar Haveli and Daman and Diu")).isTrue();
        assertThat(validator.isValidState("Andaman and Nicobar Islands")).isTrue();
        assertThat(validator.isValidState("Jammu and Kashmir")).isTrue();
        assertThat(validator.isValidState("Ladakh")).isTrue();
    }
}
