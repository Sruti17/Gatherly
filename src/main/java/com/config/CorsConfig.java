package com.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.frontend-url:http://localhost:5174}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(
        CorsRegistry registry
    ) {

        registry
            .addMapping("/api/**")

            /*
             * Local development + Render-hosted frontend.
             *
             * Later, when you have a custom domain,
             * tighten this further.
             */
            .allowedOriginPatterns(
                "http://localhost:*",
                "https://*.onrender.com",
                frontendUrl
            )

            .allowedMethods(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )

            .allowedHeaders("*")

            .exposedHeaders("*")

            .allowCredentials(false)

            .maxAge(3600);
    }
}