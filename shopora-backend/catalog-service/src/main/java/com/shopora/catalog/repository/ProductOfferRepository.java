package com.shopora.catalog.repository;

import com.shopora.catalog.entity.ProductOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Accès à la table "product_offers" (les offres commerciales des vendeurs).
 * C'est ICI que vit la logique de tri du comparateur de prix.
 */
public interface ProductOfferRepository extends JpaRepository<ProductOffer, Long> {

    /**
     * Coeur du comparateur de prix : retourne toutes les offres
     * d'un produit donné, triées du moins cher au plus cher.
     * Spring Data JPA génère automatiquement la clause
     * "WHERE product_id = ? ORDER BY price ASC" à partir du nom de la méthode.
     */
    List<ProductOffer> findByProductIdOrderByPriceAsc(Long productId);

    /**
     * Retourne toutes les offres publiées par un vendeur précis
     * (utilisé pour le tableau de bord VENDOR : "mes produits en vente").
     */
    List<ProductOffer> findByVendorEmail(String vendorEmail);

    /**
     * Vérifie qu'une offre précise appartient bien à un vendeur précis,
     * AVANT d'autoriser une modification ou suppression.
     * Essentiel pour éviter qu'un VENDOR_A modifie le prix d'un VENDOR_B
     * juste en devinant l'ID de l'offre dans l'URL (faille IDOR classique).
     */
    boolean existsByIdAndVendorEmail(Long id, String vendorEmail);
}