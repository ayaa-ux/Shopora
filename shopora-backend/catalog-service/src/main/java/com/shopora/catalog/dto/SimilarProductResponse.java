package com.shopora.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Produit "similaire" renvoyé par le comparateur de prix.
 * bestPrice / bestOfferId / bestVendorEmail décrivent la meilleure offre
 * EN STOCK de ce produit (null si aucun vendeur n'a de stock).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarProductResponse {
    private Long id;
    private String name;
    private String category;
    private String imageUrl;
    private BigDecimal bestPrice;
    private Long bestOfferId;
    private String bestVendorEmail;
    private int offersCount;
    /** Score de ressemblance entre 0 et 1 (comparaison des noms). */
    private double similarity;
}
