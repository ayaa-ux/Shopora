package com.shopora.catalog.service;

import com.shopora.catalog.dto.SimilarProductResponse;
import com.shopora.catalog.entity.Product;
import com.shopora.catalog.entity.ProductOffer;
import com.shopora.catalog.repository.ProductOfferRepository;
import com.shopora.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Comparateur de prix entre produits SIMILAIRES.
 *
 * Deux vendeurs peuvent créer séparément la même fiche ("iPhone 15 128Go" /
 * "Apple iPhone 15 128 Go"). On les rapproche par la similarité de Jaccard
 * sur les mots du nom (accents, casse et ponctuation ignorés), dans la même
 * catégorie. Règle de sécurité : les nombres doivent être identiques
 * (128 Go != 256 Go), sinon ce ne sont pas des produits comparables.
 */
@Service
@RequiredArgsConstructor
public class ProductSimilarityService {

    public static final double THRESHOLD = 0.6;
    private static final int MAX_RESULTS = 8;
    private static final Set<String> STOP_WORDS = Set.of(
            "le", "la", "les", "de", "du", "des", "un", "une", "et", "pour", "avec", "en", "a");

    private final ProductRepository productRepository;
    private final ProductOfferRepository productOfferRepository;

    /** Produits similaires à un produit existant. */
    public List<SimilarProductResponse> findSimilarTo(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable."));
        return findSimilar(product.getName(), product.getCategory(), productId);
    }

    /** Produits similaires à un nom (utilisé avant la création d'une fiche). */
    public List<SimilarProductResponse> findSimilar(String name, String category, Long excludeId) {
        if (name == null || name.isBlank() || category == null || category.isBlank()) {
            return List.of();
        }
        Set<String> reference = tokens(name);
        if (reference.isEmpty()) {
            return List.of();
        }

        List<SimilarProductResponse> result = new ArrayList<>();
        for (Product candidate : productRepository.findByCategory(category)) {
            if (excludeId != null && excludeId.equals(candidate.getId())) continue;
            double score = similarity(reference, tokens(candidate.getName()));
            if (score < THRESHOLD) continue;
            result.add(toResponse(candidate, score));
        }

        // Moins cher d'abord ; les produits sans offre en stock à la fin
        result.sort(Comparator
                .comparing((SimilarProductResponse r) -> r.getBestPrice() == null)
                .thenComparing(r -> r.getBestPrice() == null ? java.math.BigDecimal.ZERO : r.getBestPrice())
                .thenComparing(Comparator.comparingDouble(SimilarProductResponse::getSimilarity).reversed()));
        return result.size() > MAX_RESULTS ? result.subList(0, MAX_RESULTS) : result;
    }

    private SimilarProductResponse toResponse(Product p, double score) {
        List<ProductOffer> offers = productOfferRepository.findByProductIdOrderByPriceAsc(p.getId());
        ProductOffer best = offers.stream()
                .filter(o -> o.getStockQuantity() != null && o.getStockQuantity() > 0)
                .findFirst().orElse(null);
        return SimilarProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .category(p.getCategory())
                .imageUrl(p.getImageUrl())
                .bestPrice(best == null ? null : best.getPrice())
                .bestOfferId(best == null ? null : best.getId())
                .bestVendorEmail(best == null ? null : best.getVendorEmail())
                .offersCount(offers.size())
                .similarity(Math.round(score * 100.0) / 100.0)
                .build();
    }

    static double similarity(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        if (!numbers(a).equals(numbers(b))) return 0;
        Set<String> inter = new HashSet<>(a);
        inter.retainAll(b);
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        return (double) inter.size() / union.size();
    }

    private static Set<String> numbers(Set<String> tokens) {
        return tokens.stream().filter(t -> t.chars().allMatch(Character::isDigit))
                .collect(Collectors.toSet());
    }

    static Set<String> tokens(String name) {
        String s = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ");
        // "128go" -> "128 go" ; "iphone15" -> "iphone 15"
        s = s.replaceAll("(?<=\\d)(?=[a-z])|(?<=[a-z])(?=\\d)", " ");
        Set<String> out = new LinkedHashSet<>();
        for (String t : s.trim().split("\\s+")) {
            if (!t.isEmpty() && !STOP_WORDS.contains(t)) out.add(t);
        }
        return out;
    }
}
