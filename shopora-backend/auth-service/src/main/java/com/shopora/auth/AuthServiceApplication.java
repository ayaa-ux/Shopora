package com.shopora.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée du microservice auth-service.
 * Cette classe ne fait qu'une chose : démarrer le contexte Spring Boot,
 * qui va alors scanner tous les packages sous "com.shopora.auth"
 * (controller, service, repository, security...) et instancier
 * automatiquement tous les @Component, @Service, @Repository, @RestController.
 */
@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}