package com.shopora.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO renvoyé au frontend avec la réponse de l'assistant.
 * "productsFound" est surtout utile en développement/démo : permet de
 * vérifier facilement si le RAG a bien trouvé du contexte pertinent
 * avant de générer la réponse (0 = l'IA a répondu "à l'aveugle").
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantResponse {

    private String answer;
    private int productsFound;
}