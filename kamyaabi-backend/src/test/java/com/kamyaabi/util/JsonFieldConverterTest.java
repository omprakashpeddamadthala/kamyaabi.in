package com.kamyaabi.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JsonFieldConverterTest {

    private static final TypeReference<Map<String, String>> MAP_TYPE = new TypeReference<>() {};
    private static final TypeReference<List<String>> LIST_TYPE = new TypeReference<>() {};

    private final JsonFieldConverter converter = new JsonFieldConverter(new ObjectMapper());

    @Test
    void read_validMapJson_returnsMap() {
        Map<String, String> result = converter.read("{\"a\":\"1\"}", MAP_TYPE);
        assertThat(result).containsEntry("a", "1");
    }

    @Test
    void read_validListJson_returnsList() {
        List<String> result = converter.read("[\"x\",\"y\"]", LIST_TYPE);
        assertThat(result).containsExactly("x", "y");
    }

    @Test
    void read_null_returnsNull() {
        assertThat(converter.read(null, MAP_TYPE)).isNull();
    }

    @Test
    void read_blank_returnsNull() {
        assertThat(converter.read("   ", LIST_TYPE)).isNull();
    }

    @Test
    void read_invalidJson_returnsNull() {
        assertThat(converter.read("{not-json", MAP_TYPE)).isNull();
    }

    @Test
    void write_null_returnsNull() {
        assertThat(converter.write(null)).isNull();
    }

    @Test
    void write_emptyMap_returnsNull() {
        assertThat(converter.write(Map.of())).isNull();
    }

    @Test
    void write_emptyList_returnsNull() {
        assertThat(converter.write(List.of())).isNull();
    }

    @Test
    void write_nonEmptyMap_returnsJson() {
        assertThat(converter.write(Map.of("a", "1"))).isEqualTo("{\"a\":\"1\"}");
    }

    @Test
    void write_nonEmptyList_returnsJson() {
        assertThat(converter.write(List.of("x", "y"))).isEqualTo("[\"x\",\"y\"]");
    }

    @Test
    void write_unserializableValue_returnsNull() {
        Object unserializable = new Object();
        assertThat(converter.write(unserializable)).isNull();
    }
}
