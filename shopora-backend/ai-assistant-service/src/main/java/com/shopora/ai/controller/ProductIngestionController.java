package com.shopora.ai.controller;

import com.shopora.ai.dto.ProductIngestionRequest;
import com.shopora.ai.service.ProductIngestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints techniques d'indexation. Réservés à ADMIN ou à catalog-service
 * (qui s'authentifie via l'en-tête X-Internal-Key, voir JwtFilter).
 */
@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class ProductIngestionController {

    private final ProductIngestionService productIngestionService;

    @PostMapping("/ingest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> ingestProduct(@Valid @RequestBody ProductIngestionRequest request) {
        productIngestionService.ingestProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/ingest/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeProduct(@PathVariable Long productId) {
        productIngestionService.removeProduct(productId);
        return ResponseEntity.noContent().build();
    }
}