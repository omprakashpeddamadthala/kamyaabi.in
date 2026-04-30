package com.kamyaabi.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Value("${app.support.email:support@kamyaabi.in}")
    private String supportEmail;

    @Value("${app.support.url:https://kamyaabi.in}")
    private String supportUrl;

    @Bean
    public OpenAPI kamyaabiOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Kamyaabi eCommerce API")
                        .description("REST API for Kamyaabi - Premium Dry Fruits eCommerce Platform")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Kamyaabi Support")
                                .email(supportEmail)
                                .url(supportUrl))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .name("Bearer Authentication")
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
