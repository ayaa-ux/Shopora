package com.shopora.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO renvoyé au frontend pour une offre précise d'un vendeur.
 * Utilisé à 2 endroits :
 * 1. Liste des offres d'un produit, triée par prix -> alimente le comparateur de prix.
 * 2. Tableau de bord du VENDOR -> liste de "mes offres en vente".
 *
 * "productName" est dénormalisé (dupliqué depuis Product) volontairement :
 * ça évite à React de devoir faire un second appel juste pour afficher
 * le nom du produit à côté de chaque offre dans le tableau de bord vendeur.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductOfferResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String vendorEmail;
    private BigDecimal price;
    private Integer stockQuantity;
    private LocalDateTime updatedAt;
}