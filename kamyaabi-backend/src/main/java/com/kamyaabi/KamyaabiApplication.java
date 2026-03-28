package com.kamyaabi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class KamyaabiApplication {

    public static void main(String[] args) {
        SpringApplication.run(KamyaabiApplication.class, args);
    }
}
