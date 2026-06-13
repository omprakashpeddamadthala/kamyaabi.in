package com.kamyaabi.service.shiprocket;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ShiprocketResponseParserTest {

    @Test
    void toSafeString_normalizesNullLikeValues() {
        assertThat(ShiprocketResponseParser.toSafeString(null)).isNull();
        assertThat(ShiprocketResponseParser.toSafeString("null")).isNull();
        assertThat(ShiprocketResponseParser.toSafeString("  ")).isNull();
        assertThat(ShiprocketResponseParser.toSafeString(42)).isEqualTo("42");
    }

    @Test
    void isPresent_rejectsBlankAndNullLiteral() {
        assertThat(ShiprocketResponseParser.isPresent(null)).isFalse();
        assertThat(ShiprocketResponseParser.isPresent("")).isFalse();
        assertThat(ShiprocketResponseParser.isPresent("null")).isFalse();
        assertThat(ShiprocketResponseParser.isPresent("12345")).isTrue();
    }

    @Test
    void extractFirstShipment_handlesListMapAndMissing() {
        Map<String, Object> shipment = Map.of("awb_code", "AWB1");
        assertThat(ShiprocketResponseParser.extractFirstShipment(Map.of("shipments", List.of(shipment))))
                .containsEntry("awb_code", "AWB1");
        assertThat(ShiprocketResponseParser.extractFirstShipment(Map.of("shipments", shipment)))
                .containsEntry("awb_code", "AWB1");
        assertThat(ShiprocketResponseParser.extractFirstShipment(Map.of("shipments", List.of()))).isNull();
        assertThat(ShiprocketResponseParser.extractFirstShipment(Map.of())).isNull();
    }

    @Test
    void nameSplitting_handlesSingleAndMultiWord() {
        assertThat(ShiprocketResponseParser.firstName("John Doe")).isEqualTo("John");
        assertThat(ShiprocketResponseParser.lastName("John Doe")).isEqualTo("Doe");
        assertThat(ShiprocketResponseParser.firstName("Madonna")).isEqualTo("Madonna");
        assertThat(ShiprocketResponseParser.lastName("Madonna")).isEmpty();
        assertThat(ShiprocketResponseParser.firstName(null)).isEmpty();
        assertThat(ShiprocketResponseParser.lastName(" ")).isEmpty();
    }

    @Test
    void parseEstimatedDays_roundsUpAndFailsSoftly() {
        assertThat(ShiprocketResponseParser.parseEstimatedDays("2.3")).isEqualTo(3);
        assertThat(ShiprocketResponseParser.parseEstimatedDays(4)).isEqualTo(4);
        assertThat(ShiprocketResponseParser.parseEstimatedDays("n/a")).isNull();
        assertThat(ShiprocketResponseParser.parseEstimatedDays(null)).isNull();
    }
}
