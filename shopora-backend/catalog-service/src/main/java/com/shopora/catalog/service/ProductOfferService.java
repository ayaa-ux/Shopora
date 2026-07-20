package com.shopora.catalog.service;

import com.shopora.catalog.dto.ProductOfferRequest;
import com.shopora.catalog.dto.ProductOfferResponse;
import com.shopora.catalog.entity.Product;
import com.shopora.catalog.entity.ProductOffer;
import com.shopora.catalog.repository.ProductOfferRepository;
import com.shopora.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductOfferService {

    private final ProductOfferRepository productOfferRepository;
    private final ProductRepository productRepository;

    /**
     * Crée une offre commerciale. vendorEmail provient TOUJOURS du token JWT
     * (extrait dans le Controller via @AuthenticationPrincipal), jamais du corps
     * de la requête envoyé par React -> empêche un VENDOR de créer une offre
     * en se faisant passer pour un autre vendeur.
     */
    public ProductOfferResponse createOffer(ProductOfferRequest request, String vendorEmail) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable."));

        ProductOffer offer = ProductOffer.builder()
                .product(product)
                .vendorEmail(vendorEmail)
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .build();

        productOfferRepository.save(offer);
        return mapToResponse(offer);
    }

    /**
     * Coeur du comparateur de prix côté API : retourne les offres
     * d'un produit, déjà triées du moins cher au plus cher.
     */
    public List<ProductOfferResponse> getOffersByProduct(Long productId) {
        return productOfferRepository.findByProductIdOrderByPriceAsc(productId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ProductOfferResponse> getMyOffers(String vendorEmail) {
        return productOfferRepository.findByVendorEmail(vendorEmail).stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Modifie une offre. Vérifie D'ABORD la propriété (anti-IDOR) avant
     * tout accès aux données -> un VENDOR ne peut jamais modifier l'offre d'un autre,
     * même en devinant un ID dans l'URL.
     */
    public ProductOfferResponse updateOffer(Long offerId, ProductOfferRequest request, String vendorEmail) {
        if (!productOfferRepository.existsByIdAndVendorEmail(offerId, vendorEmail)) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à modifier cette offre.");
        }

        ProductOffer offer = productOfferRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable."));

        offer.setPrice(request.getPrice());
        offer.setStockQuantity(request.getStockQuantity());

        productOfferRepository.save(offer);
        return mapToResponse(offer);
    }

    public void deleteOffer(Long offerId, String vendorEmail) {
        if (!productOfferRepository.existsByIdAndVendorEmail(offerId, vendorEmail)) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à supprimer cette offre.");
        }
        productOfferRepository.deleteById(offerId);
    }

    // Nécessaire pour le Home : retrouve une offre précise à partir de son ID
// (utilisé pour enrichir l'aperçu d'une session de Group Buying avec
// le nom du produit et son prix d'origine).
    public ProductOfferResponse getOfferById(Long id) {
        ProductOffer offer = productOfferRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable."));
        return mapToResponse(offer);
    }

    private ProductOfferResponse mapToResponse(ProductOffer offer) {
        return ProductOfferResponse.builder()
                .id(offer.getId())
                .productId(offer.getProduct().getId())
                .productName(offer.getProduct().getName())
                .vendorEmail(offer.getVendorEmail())
                .price(offer.getPrice())
                .stockQuantity(offer.getStockQuantity())
                .updatedAt(offer.getUpdatedAt())
                .build();
    }
}