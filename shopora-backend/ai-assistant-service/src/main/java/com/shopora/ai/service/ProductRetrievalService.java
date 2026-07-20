package com.shopora.ai.service;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Seconde moitié du pipeline RAG : transforme la question du client en
 * vecteur, puis cherche dans pgvector les produits dont le sens est le
 * plus proche mathématiquement (distance cosinus, gérée en interne par
 * PgVectorEmbeddingStore via l'opérateur SQL <=>).
 */
@Service
@RequiredArgsConstructor
public class ProductRetrievalService {

    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;

    // On ne retourne jamais plus de 5 produits : assez pour donner du
    // contexte à l'IA, sans noyer le prompt avec des résultats peu pertinents.
    private static final int MAX_RESULTS = 5;

    // Score de similarité minimum (entre 0 et 1) : un score trop bas signifie
    // que le produit n'a en réalité aucun rapport avec la question -> on
    // préfère répondre "aucun produit trouvé" plutôt que de citer un produit
    // hors sujet juste parce qu'il était "le moins éloigné" de tous.
    private static final double MIN_SCORE = 0.6;

    public List<String> findRelevantProducts(String userQuestion) {
        Embedding questionEmbedding = embeddingModel.embed(userQuestion).content();

        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(questionEmbedding)
                .maxResults(MAX_RESULTS)
                .minScore(MIN_SCORE)
                .build();

        EmbeddingSearchResult<TextSegment> searchResult = embeddingStore.search(searchRequest);

        // On ne renvoie que le texte enrichi de chaque produit trouvé
        // (celui-là même construit dans ProductIngestionService) :
        // c'est exactement ce texte qui sera injecté dans le prompt final.
        return searchResult.matches().stream()
                .map(match -> match.embedded().text())
                .toList();
    }
}