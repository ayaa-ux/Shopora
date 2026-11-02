package com.shopora.catalog.service;

import com.shopora.catalog.dto.CatalogStatsResponse;
import com.shopora.catalog.dto.ProductOfferResponse;
import com.shopora.catalog.entity.Product;
import com.shopora.catalog.entity.ProductOffer;
import com.shopora.catalog.repository.ProductOfferRepository;
import com.shopora.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class AdminCatalogService {

    // En dessous (ou égal) de ce seuil, une offre apparaît dans les alertes de stock
    private static final int LOW_STOCK_THRESHOLD = 5;

    private final ProductRepository productRepository;
    private final ProductOfferRepository offerRepository;

    @Transactional(readOnly = true)
    public List<ProductOfferResponse> getAllOffers() {
        return offerRepository.findAll().stream()
                .sorted(Comparator.comparing(ProductOffer::getId).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteOffer(Long offerId) {
        if (!offerRepository.existsById(offerId)) {
            throw new IllegalArgumentException("Offre introuvable.");
        }
        offerRepository.deleteById(offerId);
    }

    @Transactional(readOnly = true)
    public CatalogStatsResponse getStats() {
        List<Product> products = productRepository.findAll();
        List<ProductOffer> offers = offerRepository.findAll();

        Set<Long> productsWithOffer = new HashSet<>();
        Set<String> vendors = new HashSet<>();
        long totalStock = 0;
        BigDecimal inventoryValue = BigDecimal.ZERO;

        for (ProductOffer offer : offers) {
            productsWithOffer.add(offer.getProduct().getId());
            vendors.add(offer.getVendorEmail());
            int stock = offer.getStockQuantity() == null ? 0 : offer.getStockQuantity();
            totalStock += stock;
            inventoryValue = inventoryValue.add(offer.getPrice().multiply(BigDecimal.valueOf(stock)));
        }

        Map<String, Long> byCategory = new TreeMap<>();
        for (Product p : products) {
            byCategory.merge(p.getCategory(), 1L, Long::sum);
        }
        List<CatalogStatsResponse.CategoryCount> categories = byCategory.entrySet().stream()
                .map(e -> new CatalogStatsResponse.CategoryCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(CatalogStatsResponse.CategoryCount::count).reversed())
                .toList();

        List<CatalogStatsResponse.LowStockItem> lowStock = offers.stream()
                .filter(o -> o.getStockQuantity() != null && o.getStockQuantity() <= LOW_STOCK_THRESHOLD)
                .sorted(Comparator.comparing(ProductOffer::getStockQuantity))
                .map(o -> new CatalogStatsResponse.LowStockItem(o.getId(), o.getProduct().getId(),
                        o.getProduct().getName(), o.getVendorEmail(), o.getStockQuantity()))
                .toList();

        long withoutOffer = products.stream().filter(p -> !productsWithOffer.contains(p.getId())).count();

        return new CatalogStatsResponse(products.size(), offers.size(), vendors.size(),
                withoutOffer, totalStock, inventoryValue, categories, lowStock);
    }

    private ProductOfferResponse toResponse(ProductOffer offer) {
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
