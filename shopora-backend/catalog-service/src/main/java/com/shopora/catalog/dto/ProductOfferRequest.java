package com.shopora.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO reçu pour créer ou modifier l'offre commerciale d'un vendeur
 * sur un produit existant (prix + stock).
 */
@Data
public class ProductOfferRequest {

    @NotNull(message = "L'identifiant du produit est obligatoire")
    private Long productId;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix doit être supérieur à 0")
    private BigDecimal price;

    @NotNull(message = "La quantité en stock est obligatoire")
    @Min(value = 0, message = "Le stock ne peut pas être négatif")
    private Integer stockQuantity;
}