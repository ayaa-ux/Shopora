package com.shopora.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO renvoyé au frontend pour afficher une fiche produit dans le catalogue.
 *
 * Le champ "lowestPrice" est calculé côté service (pas stocké en base) :
 * il permet d'afficher directement "à partir de 249 MAD" sur la carte produit
 * dans la grille du catalogue, sans que React ait besoin de charger
 * toutes les offres juste pour connaître le prix le plus bas.
 * Si "lowestPrice" est null, ça signifie qu'aucun vendeur ne propose encore ce produit.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String category;
    private String imageUrl;
    private BigDecimal lowestPrice;
    private LocalDateTime createdAt;
}