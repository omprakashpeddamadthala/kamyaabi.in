package com.kamyaabi.config;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Configuration
@ConfigurationProperties(prefix = "product.image")
@Validated
@Getter
@Setter
public class ProductImageProperties {

    @Min(1)
    private int maxCount = 100;
}
