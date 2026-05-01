package com.kamyaabi.config;

import jakarta.servlet.MultipartConfigElement;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MultipartConfigTest {

    @Test
    void multipartConfigElement_hasUnlimitedFileAndRequestSizes() {
        MultipartConfigElement element = new MultipartConfig().multipartConfigElement();

        assertThat(element.getMaxFileSize()).isEqualTo(-1L);
        assertThat(element.getMaxRequestSize()).isEqualTo(-1L);
        assertThat(element.getFileSizeThreshold()).isZero();
        assertThat(element.getLocation()).isNullOrEmpty();
    }
}
