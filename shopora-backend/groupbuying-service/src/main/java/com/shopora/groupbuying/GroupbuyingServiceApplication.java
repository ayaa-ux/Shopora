package com.shopora.groupbuying;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Point d'entrée du microservice groupbuying-service.
 *
 * @EnableScheduling : active le mécanisme de planification de Spring,
 * indispensable pour que @Scheduled (dans GroupBuySessionScheduler)
 * soit réellement exécuté. Sans cette annotation, la méthode
 * resolveExpiredSessions() ne serait JAMAIS appelée automatiquement.
 */
@SpringBootApplication
@EnableScheduling
public class GroupbuyingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GroupbuyingServiceApplication.class, args);
    }
}