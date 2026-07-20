package com.shopora.catalog.repository;

import com.shopora.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Accès à la table "products" (fiches génériques du catalogue).
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Recherche les produits par catégorie (ex: "Électronique", "Mode"...).
     * Utilisé pour le filtrage du catalogue côté frontend.
     */
    List<Product> findByCategory(String category);

    /**
     * Recherche insensible à la casse sur le nom du produit (barre de recherche).
     * "Contains" génère un LIKE '%mot%' en SQL.
     */
    List<Product> findByNameContainingIgnoreCase(String keyword);
}