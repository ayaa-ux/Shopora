package com.shopora.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO reçu quand un client pose une question à l'assistant IA
 * (ex: "un sac à moins de 300 MAD ?").
 */
@Data
public class AssistantRequest {

    @NotBlank(message = "La question est obligatoire")
    private String question;
}