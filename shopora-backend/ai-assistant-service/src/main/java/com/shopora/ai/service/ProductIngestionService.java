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

        embeddingStore.add(embedding, segment);

        log.info("Produit {} indexé dans la base vectorielle.", request.getProductId());
    }

    /**
     * Cette version de langchain4j génère elle-même l'identifiant du vecteur, donc on ne peut pas
     * retrouver le vecteur d'un produit précis pour le supprimer. On le signale clairement.
     */
    public void removeProduct(Long productId) {
        log.warn("Produit {} supprimé du catalogue, mais son vecteur reste dans l'index IA "
                + "(suppression ciblée non supportée avec cette version).", productId);
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