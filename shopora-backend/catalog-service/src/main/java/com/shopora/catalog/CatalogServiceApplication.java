package com.shopora.catalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * @EnableAsync : l'indexation vers ai-assistant-service se fait en arrière-plan,
 * sans ralentir la création d'un produit ou d'une offre.
 */
@SpringBootApplication
@EnableAsync
public class CatalogServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogServiceApplication.class, args);
    }
}