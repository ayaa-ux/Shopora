package com.shopora.catalog.repository;

import com.shopora.catalog.entity.ProductOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductOfferRepository extends JpaRepository<ProductOffer, Long> {

    List<ProductOffer> findByProductIdOrderByPriceAsc(Long productId);

    List<ProductOffer> findByVendorEmail(String vendorEmail);

    boolean existsByIdAndVendorEmail(Long id, String vendorEmail);

    // Un vendeur = une seule offre par produit
    boolean existsByProductIdAndVendorEmail(Long productId, String vendorEmail);

    // Nécessaire pour supprimer un produit sans violer la clé étrangère
    void deleteByProductId(Long productId);

    /** Retire du stock de façon atomique. Renvoie 0 si le stock est insuffisant. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ProductOffer o set o.stockQuantity = o.stockQuantity - :qty "
            + "where o.id = :id and o.stockQuantity >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);

    /** Rend du stock (annulation / échec de commande). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ProductOffer o set o.stockQuantity = o.stockQuantity + :qty where o.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") int qty);
}
