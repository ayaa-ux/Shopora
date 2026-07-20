package com.shopora.ai.service;

import com.shopora.ai.dto.ProductIngestionRequest;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Première moitié du pipeline RAG : transforme une fiche produit en vecteur
 * numérique et l'enregistre dans pgvector, pour qu'elle soit retrouvable
 * plus tard par recherche de similarité (voir ProductRetrievalService).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductIngestionService {

    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;

    public void ingestProduct(ProductIngestionRequest request) {

        String enrichedText = buildEnrichedText(request);

        Embedding embedding = embeddingModel.embed(enrichedText).content();

        Metadata metadata = Metadata.from("productId", request.getProductId().toString());
        TextSegment segment = TextSegment.from(enrichedText, metadata);

        // add(embedding, segment) : stocke le vecteur ET son contenu/metadata,
        // génère un ID interne automatiquement. C'est la méthode la plus simple
        // et la plus largement supportée par toutes les implémentations
        // d'EmbeddingStore (pgvector, in-memory, etc.).
        //
        // LIMITE CONNUE : un appel répété pour le même productId crée un
        // nouveau vecteur plutôt que de mettre à jour l'existant. Acceptable
        // pour ce projet (chaque produit n'est indexé qu'une fois en démo).
        embeddingStore.add(embedding, segment);

        log.info("Produit {} indexé avec succès dans la base vectorielle.", request.getProductId());
    }

    private String buildEnrichedText(ProductIngestionRequest request) {
        StringBuilder text = new StringBuilder();
        text.append("Produit : ").append(request.getName()).append(". ");
        text.append("Catégorie : ").append(request.getCategory()).append(". ");

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            text.append("Description : ").append(request.getDescription()).append(". ");
        }

        if (request.getLowestPrice() != null) {
            text.append("Prix à partir de ").append(request.getLowestPrice()).append(" MAD.");
        }

        return text.toString();
    }
}