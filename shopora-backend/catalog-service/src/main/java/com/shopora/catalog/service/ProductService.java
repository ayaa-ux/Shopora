package com.shopora.catalog.service;

import com.shopora.catalog.dto.ProductRequest;
import com.shopora.catalog.dto.ProductResponse;
import com.shopora.catalog.entity.Product;
import com.shopora.catalog.entity.ProductOffer;
import com.shopora.catalog.repository.ProductOfferRepository;
import com.shopora.catalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductOfferRepository productOfferRepository;
    private final ProductIndexingService indexingService;

    public ProductResponse createProduct(ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .build();

        productRepository.save(product);
        indexingService.indexProduct(product.getId());
        return mapToResponse(product);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable."));
        return mapToResponse(product);
    }

    public List<ProductResponse> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ProductResponse> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable."));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());

        productRepository.save(product);
        indexingService.indexProduct(product.getId());
        return mapToResponse(product);
    }

    /**
     * Supprime d'abord les offres liées (sinon violation de clé étrangère -> erreur 500),
     * puis le produit, puis retire le produit de l'index de l'assistant IA.
     */
    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new IllegalArgumentException("Produit introuvable.");
        }
        productOfferRepository.deleteByProductId(id);
        productRepository.deleteById(id);
        indexingService.removeProduct(id);
    }

    private ProductResponse mapToResponse(Product product) {
        List<ProductOffer> offers = productOfferRepository.findByProductIdOrderByPriceAsc(product.getId());
        BigDecimal lowestPrice = offers.isEmpty() ? null : offers.get(0).getPrice();

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .lowestPrice(lowestPrice)
                .createdAt(product.getCreatedAt())
                .build();
    }
}