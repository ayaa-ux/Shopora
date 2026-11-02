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
    private final ProductIndexingService indexingService;

    public ProductOfferResponse createOffer(ProductOfferRequest request, String vendorEmail) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable."));

        if (productOfferRepository.existsByProductIdAndVendorEmail(product.getId(), vendorEmail)) {
            throw new IllegalArgumentException(
                    "Vous avez déjà une offre sur ce produit. Modifiez-la depuis votre espace vendeur.");
        }

        ProductOffer offer = ProductOffer.builder()
                .product(product)
                .vendorEmail(vendorEmail)
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .build();

        productOfferRepository.save(offer);
        indexingService.indexProduct(product.getId()); // le prix le plus bas a peut-être changé
        return mapToResponse(offer);
    }

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

    public ProductOfferResponse updateOffer(Long offerId, ProductOfferRequest request, String vendorEmail) {
        if (!productOfferRepository.existsByIdAndVendorEmail(offerId, vendorEmail)) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à modifier cette offre.");
        }

        ProductOffer offer = productOfferRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable."));

        offer.setPrice(request.getPrice());
        offer.setStockQuantity(request.getStockQuantity());

        productOfferRepository.save(offer);
        indexingService.indexProduct(offer.getProduct().getId());
        return mapToResponse(offer);
    }

    public void deleteOffer(Long offerId, String vendorEmail) {
        if (!productOfferRepository.existsByIdAndVendorEmail(offerId, vendorEmail)) {
            throw new AccessDeniedException("Vous n'êtes pas autorisé à supprimer cette offre.");
        }
        Long productId = productOfferRepository.findById(offerId)
                .map(o -> o.getProduct().getId())
                .orElse(null);

        productOfferRepository.deleteById(offerId);
        if (productId != null) {
            indexingService.indexProduct(productId);
        }
    }

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