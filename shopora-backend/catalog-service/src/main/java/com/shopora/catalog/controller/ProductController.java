package com.shopora.catalog.controller;

import com.shopora.catalog.dto.ProductRequest;
import com.shopora.catalog.dto.ProductResponse;
import com.shopora.catalog.dto.SimilarProductResponse;
import com.shopora.catalog.service.ProductIndexingService;
import com.shopora.catalog.service.ProductSimilarityService;
import com.shopora.catalog.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductIndexingService indexingService;
    private final ProductSimilarityService similarityService;

    @PostMapping
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    /** Comparateur : produits similaires (même article créé par d'autres vendeurs). */
    @GetMapping("/{id}/similar")
    public ResponseEntity<List<SimilarProductResponse>> getSimilar(@PathVariable Long id) {
        return ResponseEntity.ok(similarityService.findSimilarTo(id));
    }

    /** Détection de doublon avant création d'une fiche produit. */
    @GetMapping("/similar")
    public ResponseEntity<List<SimilarProductResponse>> findSimilarByName(@RequestParam String name,
                                                                          @RequestParam String category) {
        return ResponseEntity.ok(similarityService.findSimilar(name, category, null));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> searchProducts(@RequestParam String keyword) {
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id,
                                                         @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Nouveau : réindexe TOUT le catalogue dans l'assistant IA (à lancer une fois
     * pour les produits déjà existants avant la démo). Réservé ADMIN.
     */
    @PostMapping("/reindex")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reindexAll() {
        indexingService.reindexAll();
        return ResponseEntity.accepted().build();
    }
}