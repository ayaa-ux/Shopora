package com.shopora.catalog.controller;

import com.shopora.catalog.dto.CatalogStatsResponse;
import com.shopora.catalog.dto.ProductOfferResponse;
import com.shopora.catalog.service.AdminCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints d'administration du catalogue (ADMIN uniquement).
 * Les chemins commencent par /api/products et /api/offers pour passer par les
 * routes existantes de l'api-gateway.
 * (Supprimer un produit : DELETE /api/products/{id} existe déjà. Réindexer l'IA : POST /api/products/reindex.)
 */
@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCatalogController {

    private final AdminCatalogService adminCatalogService;

    @GetMapping("/api/products/admin/stats")
    public ResponseEntity<CatalogStatsResponse> getStats() {
        return ResponseEntity.ok(adminCatalogService.getStats());
    }

    @GetMapping("/api/offers/admin/all")
    public ResponseEntity<List<ProductOfferResponse>> getAllOffers() {
        return ResponseEntity.ok(adminCatalogService.getAllOffers());
    }

    @DeleteMapping("/api/offers/admin/{id}")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long id) {
        adminCatalogService.deleteOffer(id);
        return ResponseEntity.noContent().build();
    }
}
