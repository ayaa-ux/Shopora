package com.shopora.ai.controller;

import com.shopora.ai.dto.ProductIngestionRequest;
import com.shopora.ai.service.ProductIngestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint technique d'indexation, réservé à ADMIN (voir justification
 * dans SecurityConfig). Utilisé pour peupler la base vectorielle avant
 * la démonstration/soutenance.
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
}