package com.shopora.catalog.controller;

import com.shopora.catalog.repository.ProductOfferRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints réservés aux autres services (clé X-Internal-Key) : réserver / rendre du stock.
 * La réservation est atomique côté SQL (UPDATE ... WHERE stock >= qty) : deux commandes
 * simultanées ne peuvent pas vendre deux fois la dernière unité.
 */
@RestController
@RequestMapping("/api/offers/internal")
@RequiredArgsConstructor
public class InternalOfferController {

    private final ProductOfferRepository offerRepository;

    public record StockChange(@NotNull @Min(1) Integer quantity) { }

    @PostMapping("/{id}/reserve")
    @Transactional
    public ResponseEntity<Void> reserve(@PathVariable Long id, @Valid @RequestBody StockChange body) {
        if (offerRepository.decrementStock(id, body.quantity()) == 0) {
            if (!offerRepository.existsById(id)) {
                throw new IllegalArgumentException("Offre introuvable.");
            }
            throw new IllegalStateException("Stock insuffisant.");
        }
        return ResponseEntity.noContent().build();
    }

    /** Compensation : rend le stock si la commande échoue après la réservation. */
    @PostMapping("/{id}/release")
    @Transactional
    public ResponseEntity<Void> release(@PathVariable Long id, @Valid @RequestBody StockChange body) {
        offerRepository.incrementStock(id, body.quantity());
        return ResponseEntity.noContent().build();
    }
}
