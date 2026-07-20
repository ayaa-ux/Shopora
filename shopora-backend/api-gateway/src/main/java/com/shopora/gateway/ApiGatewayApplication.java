package com.shopora.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée du Gateway.
 *
 * Contrairement aux autres microservices, cette classe ne nécessite aucune
 * annotation supplémentaire : tout le comportement de routage est piloté
 * par la présence de spring-cloud-starter-gateway dans le pom.xml et
 * la configuration déclarative dans application.yml. Spring Cloud Gateway
 * s'auto-configure dès qu'il détecte cette dépendance sur le classpath.
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}