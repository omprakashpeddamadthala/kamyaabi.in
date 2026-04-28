package com.kamyaabi.config;

import jakarta.servlet.Filter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

/**
 * Cross-cutting HTTP cache validators. The {@link ShallowEtagHeaderFilter}
 * computes an MD5 of every response body and emits a strong {@code ETag}
 * header so clients can issue conditional GETs (saves bandwidth on
 * repeat product page loads). The filter only kicks in for {@code GET}
 * requests, so admin write paths are unaffected.
 */
@Configuration
public class HttpCachingConfig {

    @Bean
    public FilterRegistrationBean<Filter> shallowEtagHeaderFilter() {
        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new ShallowEtagHeaderFilter());
        registration.addUrlPatterns("/api/products/*", "/api/categories/*");
        registration.setName("etagFilter");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 50);
        return registration;
    }
}
