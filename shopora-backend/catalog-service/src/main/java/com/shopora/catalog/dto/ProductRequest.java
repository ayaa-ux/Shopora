package com.shopora.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO reçu pour créer ou modifier une fiche produit générique.
 * Utilisé par le rôle VENDOR (et ADMIN) via le CRUD catalogue.
 */
@Data
public class ProductRequest {

    @NotBlank(message = "Le nom du produit est obligatoire")
    private String name;

    private String description; // optionnel, pas de @NotBlank

    @NotBlank(message = "La catégorie est obligatoire")
    private String category;

    private String imageUrl; // optionnel : un produit peut être créé sans image au départ
}