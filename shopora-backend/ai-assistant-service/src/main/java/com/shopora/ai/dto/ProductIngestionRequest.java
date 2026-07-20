package com.shopora.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO reçu pour "indexer" un produit dans la base vectorielle (pgvector).
 *
 * Point d'architecture important : ai-assistant-service n'a PAS accès à la
 * base shopora_catalog (principe "Database per Service", déjà appliqué
 * partout dans ce projet). Il reçoit donc les informations du produit
 * depuis l'extérieur, via cet endpoint d'ingestion.
 *
 * En production, catalog-service appellerait automatiquement cet endpoint
 * chaque fois qu'un VENDOR crée ou modifie un produit (via un simple appel
 * HTTP sortant). Pour ce projet, on peut soit câbler cet appel automatique,
 * soit déclencher l'ingestion manuellement (ex: script ou appel Postman)
 * pour peupler la base vectorielle de démonstration -> les deux options
 * utilisent exactement cet endpoint, donc rien à refaire plus tard.
 */
@Data
public class ProductIngestionRequest {

    @NotNull(message = "L'identifiant du produit est obligatoire")
    private Long productId;

    @NotBlank(message = "Le nom du produit est obligatoire")
    private String name;

    private String description;

    @NotBlank(message = "La catégorie est obligatoire")
    private String category;

    // Prix le plus bas connu au moment de l'indexation : permet à l'IA
    // de répondre à des questions de budget ("un sac à moins de 300 MAD")
    // sans avoir besoin d'interroger catalog-service en direct.
    private BigDecimal lowestPrice;
}