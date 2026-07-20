package com.shopora.ai.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Configuration centrale de l'intégration IA (LangChain4j).
 * Déclare les 3 "briques" réutilisées partout dans ce service :
 *
 * - ChatLanguageModel : génère la réponse finale en langage naturel
 *   (GPT-4 ou Grok, selon la configuration dans application.yml).
 * - EmbeddingModel : transforme un texte (question client, fiche produit)
 *   en vecteur numérique.
 * - EmbeddingStore<TextSegment> : stocke et recherche ces vecteurs dans
 *   PostgreSQL via pgvector (extension déjà activée sur shopora_ai
 *   depuis l'étape 1 du projet).
 */
@Configuration
public class LangChainConfig {

    // --- Modèle de chat (GPT-4 ou Grok) ---
    @Value("${ai.chat.api-key}")
    private String chatApiKey;

    @Value("${ai.chat.base-url}")
    private String chatBaseUrl;

    @Value("${ai.chat.model-name}")
    private String chatModelName;

    // --- Modèle d'embeddings ---
    @Value("${ai.embedding.api-key}")
    private String embeddingApiKey;

    @Value("${ai.embedding.model-name}")
    private String embeddingModelName;

    // --- Connexion pgvector ---
    @Value("${ai.vector-store.host}")
    private String vectorStoreHost;

    @Value("${ai.vector-store.port}")
    private Integer vectorStorePort;

    @Value("${ai.vector-store.database}")
    private String vectorStoreDatabase;

    @Value("${ai.vector-store.user}")
    private String vectorStoreUser;

    @Value("${ai.vector-store.password}")
    private String vectorStorePassword;

    /**
     * Modèle de génération de texte. Le même code fonctionne avec une clé
     * OpenAI (base-url officielle) ou une clé Grok/xAI (base-url =
     * https://api.x.ai/v1) -> seule la configuration change, jamais ce code.
     * C'est la preuve concrète du découplage "Grok/GPT-4" annoncé dans le rapport.
     */
    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
                .apiKey(chatApiKey)
                .baseUrl(chatBaseUrl)
                .modelName(chatModelName)
                .timeout(Duration.ofSeconds(60))
                // Température basse : on veut des réponses factuelles sur le
                // catalogue ShopOra, pas des réponses "créatives" ou inventées.
                .temperature(0.3)
                .build();
    }

    /**
     * Transforme un texte en vecteur numérique.
     * "text-embedding-3-small" (OpenAI) produit des vecteurs de dimension 1536 :
     * cette valeur DOIT correspondre EXACTEMENT à celle déclarée dans
     * embeddingStore() ci-dessous, sinon pgvector refusera l'insertion.
     */
    @Bean
    public EmbeddingModel embeddingModel() {
        return OpenAiEmbeddingModel.builder()
                .apiKey(embeddingApiKey)
                .modelName(embeddingModelName)
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    /**
     * Connexion à pgvector : stocke les vecteurs des fiches produits et
     * permet la recherche de similarité (distance cosinus) qui alimente
     * le RAG. createTable(true) crée la table automatiquement si besoin
     * (équivalent du "ddl-auto: update" de JPA, mais géré par LangChain4j ici).
     */
    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        return PgVectorEmbeddingStore.builder()
                .host(vectorStoreHost)
                .port(vectorStorePort)
                .database(vectorStoreDatabase)
                .user(vectorStoreUser)
                .password(vectorStorePassword)
                .table("product_embeddings")
                .dimension(1536) // doit correspondre à text-embedding-3-small
                .createTable(true)
                .build();
    }
}