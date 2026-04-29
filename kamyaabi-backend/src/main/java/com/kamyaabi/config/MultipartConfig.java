package com.kamyaabi.config;

import jakarta.servlet.MultipartConfigElement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Authoritative override of Spring Boot's auto-configured
 * {@link MultipartConfigElement}. The application supports admin product image
 * uploads of any size; size validation happens at the service layer (content
 * type only). By providing this bean explicitly we bypass any property-binding
 * nuances of {@code spring.servlet.multipart.max-*-size=-1} in YAML and
 * guarantee the embedded servlet container will not enforce a multipart cap.
 *
 * <p>Spring Boot's {@code MultipartAutoConfiguration} only registers its own
 * {@code MultipartConfigElement} bean when none is present, so this bean wins
 * unconditionally.
 */
@Configuration
public class MultipartConfig {

    /**
     * No size limit on uploads — images are validated at the service layer
     * if needed. Operators must size the upstream proxy
     * (e.g. Nginx {@code client_max_body_size}) accordingly.
     *
     * <ul>
     *   <li>{@code location} — null: use the servlet container default temp dir.</li>
     *   <li>{@code maxFileSize} — -1L: unlimited per-file size.</li>
     *   <li>{@code maxRequestSize} — -1L: unlimited total request size.</li>
     *   <li>{@code fileSizeThreshold} — 0: always spool to disk (avoids large
     *       in-memory buffers when uploading huge images).</li>
     * </ul>
     */
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        return new MultipartConfigElement(null, -1L, -1L, 0);
    }
}
