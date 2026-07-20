package com.shopora.ai.service;

import com.shopora.ai.dto.AssistantRequest;
import com.shopora.ai.dto.AssistantResponse;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Orchestrateur final du RAG : récupère le contexte pertinent (via
 * ProductRetrievalService), construit le prompt, puis appelle le modèle
 * de chat (GPT-4 ou Grok, selon application.yml) pour générer la réponse.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantService {

    private final ProductRetrievalService productRetrievalService;
    private final ChatLanguageModel chatLanguageModel;

    public AssistantResponse askAssistant(AssistantRequest request) {

        List<String> relevantProducts = productRetrievalService.findRelevantProducts(request.getQuestion());

        String prompt = buildPrompt(request.getQuestion(), relevantProducts);

        log.info("Question reçue : '{}' - {} produit(s) pertinent(s) trouvé(s)",
                request.getQuestion(), relevantProducts.size());

        String aiAnswer = chatLanguageModel.generate(prompt);

        return AssistantResponse.builder()
                .answer(aiAnswer)
                .productsFound(relevantProducts.size())
                .build();
    }

    /**
     * Construit le prompt final envoyé à l'IA. C'est le coeur du "prompt
     * engineering" de ce projet : on instruit explicitement le modèle de
     * ne répondre QU'à partir du contexte fourni, pour éviter qu'il
     * n'invente un produit qui n'existe pas réellement dans le catalogue
     * (un risque réel et bien connu des assistants IA, appelé "hallucination").
     */
    private String buildPrompt(String question, List<String> relevantProducts) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Tu es l'assistant shopping de ShopOra, une plateforme marocaine de social commerce. ");
        prompt.append("Réponds UNIQUEMENT à partir des produits listés ci-dessous. ");
        prompt.append("Si aucun produit ne correspond à la demande, dis-le clairement plutôt que d'inventer un produit.\n\n");

        if (relevantProducts.isEmpty()) {
            prompt.append("Aucun produit pertinent n'a été trouvé dans le catalogue pour cette demande.\n\n");
        } else {
            prompt.append("Produits du catalogue correspondant à la recherche :\n");
            for (String product : relevantProducts) {
                prompt.append("- ").append(product).append("\n");
            }
            prompt.append("\n");
        }

        prompt.append("Question du client : ").append(question);

        return prompt.toString();
    }
}