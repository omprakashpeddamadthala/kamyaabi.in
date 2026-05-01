package com.kamyaabi.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary(CloudinaryProperties properties) {
        assertResolved("cloudinary.cloud-name", "CLOUDINARY_CLOUD_NAME", properties.getCloudName());
        assertResolved("cloudinary.api-key", "CLOUDINARY_API_KEY", properties.getApiKey());
        assertResolved("cloudinary.api-secret", "CLOUDINARY_API_SECRET", properties.getApiSecret());

        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", properties.getCloudName(),
                "api_key", properties.getApiKey(),
                "api_secret", properties.getApiSecret(),
                "secure", true
        ));
    }

    private static void assertResolved(String property, String envVar, String value) {
        if (value != null && value.contains("${")) {
            throw new IllegalStateException(
                    "Cloudinary property '" + property + "' is an unresolved placeholder ('"
                            + value + "'). Set the " + envVar
                            + " environment variable on the backend container."
            );
        }
    }
}
