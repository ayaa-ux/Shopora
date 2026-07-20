package com.shopora.catalog.controller;

import com.shopora.catalog.dto.ProductOfferRequest;
import com.shopora.catalog.dto.ProductOfferResponse;
import com.shopora.catalog.service.ProductOfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints du comparateur de prix + gestion des offres VENDOR.
 *
 * @AuthenticationPrincipal String vendorEmail : récupère directement l'email
 * placé dans le token JWT. Rappel du JwtFilter de ce service : on construit
 * `new UsernamePasswordAuthenticationToken(email, null, authorities)`,
 * donc le "principal" Spring Security ici est littéralement la String email
 * (pas un objet UserDetails, contrairement à auth-service).
 */
@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class ProductOfferController {

    private final ProductOfferService productOfferService;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ProductOfferResponse> createOffer(@Valid @RequestBody ProductOfferRequest request,
                                                            @AuthenticationPrincipal String vendorEmail) {
        ProductOfferResponse response = productOfferService.createOffer(request, vendorEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint central du comparateur de prix : retourne toutes les offres
     * d'un produit, déjà triées du moins cher au plus cher.
     * Public : un visiteur non connecté doit pouvoir comparer les prix.
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductOfferResponse>> getOffersByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(productOfferService.getOffersByProduct(productId));
    }

    @GetMapping("/my-offers")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<ProductOfferResponse>> getMyOffers(@AuthenticationPrincipal String vendorEmail) {
        return ResponseEntity.ok(productOfferService.getMyOffers(vendorEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductOfferResponse> getOfferById(@PathVariable Long id) {
        return ResponseEntity.ok(productOfferService.getOfferById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ProductOfferResponse> updateOffer(@PathVariable Long id,
                                                            @Valid @RequestBody ProductOfferRequest request,
                                                            @AuthenticationPrincipal String vendorEmail) {
        return ResponseEntity.ok(productOfferService.updateOffer(id, request, vendorEmail));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteOffer(@PathVariable Long id, @AuthenticationPrincipal String vendorEmail) {
        productOfferService.deleteOffer(id, vendorEmail);
        return ResponseEntity.noContent().build();
    }
}