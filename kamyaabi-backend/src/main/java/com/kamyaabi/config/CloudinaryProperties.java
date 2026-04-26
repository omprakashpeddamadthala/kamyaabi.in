package com.kamyaabi.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Strongly-typed binding for the {@code cloudinary.*} configuration block.
 * Required at application startup so a misconfigured deployment fails fast
 * instead of at the first admin-side image upload.
 */
@Configuration
@ConfigurationProperties(prefix = "cloudinary")
@Validated
@Getter
@Setter
public class CloudinaryProperties {

    /** Cloudinary cloud name (the subdomain portion of the cloud URL). */
    @NotBlank
    private String cloudName;

    /** Cloudinary public API key. */
    @NotBlank
    private String apiKey;

    /** Cloudinary API secret; never log or expose via APIs. */
    @NotBlank
    private String apiSecret;
}
