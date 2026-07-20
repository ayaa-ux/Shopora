package com.shopora.catalog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Fiche produit générique du catalogue (ex: "iPhone 15 128Go").
 * Indépendante de tout vendeur : c'est la "vitrine" affichée au client.
 * Les prix concrets sont portés par les entités ProductOffer liées (voir ce fichier).
 */
@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    // Catégorie en simple String (pas d'entité Category séparée) :
    // suffisant pour un projet de Bachelor, évite une jointure inutile.
    @Column(nullable = false)
    private String category;

    private String imageUrl;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}