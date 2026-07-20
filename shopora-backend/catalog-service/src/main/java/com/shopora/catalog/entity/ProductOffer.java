package com.shopora.catalog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Proposition commerciale d'UN vendeur pour UN produit du catalogue.
 * C'est cette entité qui rend le comparateur de prix possible : un même
 * Product peut avoir plusieurs ProductOffer (un par vendeur), qu'on
 * trie ensuite par prix croissant pour l'affichage.
 *
 * Point d'architecture important : on ne met PAS de relation JPA (@ManyToOne)
 * vers une entité "User", car catalog-service possède sa propre base de données
 * (shopora_catalog) et n'a aucun accès à shopora_auth (principe
 * "Database per Service" en microservices, déjà appliqué à l'étape 1).
 *
 * On stocke donc uniquement "vendorEmail", extrait du claim "sub" du token JWT
 * au moment de la création de l'offre — c'est l'identifiant unique et stable
 * déjà disponible sans avoir besoin d'appeler auth-service.
 */
@Entity
@Table(name = "product_offers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lien vers la fiche produit générique concernée par cette offre
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String vendorEmail;

    // BigDecimal et jamais float/double pour une valeur monétaire :
    // évite les erreurs d'arrondi binaire (ex: 0.1 + 0.2 != 0.3 en double)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}