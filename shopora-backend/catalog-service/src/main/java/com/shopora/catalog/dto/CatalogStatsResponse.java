package com.shopora.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

/** Statistiques globales du catalogue pour l'administrateur. */
public record CatalogStatsResponse(
        long productsCount,
        long offersCount,
        long vendorsCount,
        long productsWithoutOffer,
        long totalStockUnits,
        BigDecimal inventoryValue,
        List<CategoryCount> categories,
        List<LowStockItem> lowStock) {

    public record CategoryCount(String category, long count) { }

    public record LowStockItem(Long offerId, Long productId, String productName,
                               String vendorEmail, Integer stockQuantity) { }
}
