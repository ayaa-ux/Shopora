package com.shopora.catalog.service;

import com.shopora.catalog.entity.Product;
import com.shopora.catalog.entity.ProductOffer;
import com.shopora.catalog.repository.ProductOfferRepository;
import com.shopora.catalog.repository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Pousse automatiquement les produits vers ai-assistant-service (base vectorielle),
 * pour que l'assistant connaisse réellement le catalogue.
 * Les appels sont asynchrones et tolérants aux pannes : si l'IA est indisponible,
 * le catalogue continue de fonctionner normalement.
 */
@Service
@Slf4j
public class ProductIndexingService {

    private final ProductRepository productRepository;
    private final ProductOfferRepository offerRepository;
    private final RestClient aiClient;

    public ProductIndexingService(ProductRepository productRepository,
                                  ProductOfferRepository offerRepository,
                                  @Value("${ai.service.url:http://localhost:8084}") String aiServiceUrl,
                                  @Value("${internal.api-key:shopora-internal-dev-key}") String internalKey) {
        this.productRepository = productRepository;
        this.offerRepository = offerRepository;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(20000);

        this.aiClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .defaultHeader("X-Internal-Key", internalKey)
                .requestFactory(factory)
                .build();
    }

    @Async
    public void indexProduct(Long productId) {
        productRepository.findById(productId).ifPresent(this::push);
    }

    @Async
    public void removeProduct(Long productId) {
        try {
            aiClient.delete().uri("/api/assistant/ingest/{id}", productId).retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.warn("Suppression du produit {} de l'index IA impossible : {}", productId, e.getMessage());
        }
    }

    @Async
    public void reindexAll() {
        List<Product> products = productRepository.findAll();
        products.forEach(this::push);
        log.info("Réindexation IA terminée : {} produit(s)", products.size());
    }

    private void push(Product product) {
        try {
            List<ProductOffer> offers = offerRepository.findByProductIdOrderByPriceAsc(product.getId());

            Map<String, Object> payload = new HashMap<>();
            payload.put("productId", product.getId());
            payload.put("name", product.getName());
            payload.put("description", product.getDescription());
            payload.put("category", product.getCategory());
            payload.put("lowestPrice", offers.isEmpty() ? null : offers.get(0).getPrice());

            aiClient.post()
                    .uri("/api/assistant/ingest")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Indexation IA du produit {} impossible : {}", product.getId(), e.getMessage());
        }
    }
}