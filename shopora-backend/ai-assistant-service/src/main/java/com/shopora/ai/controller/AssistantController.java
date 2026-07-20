package com.shopora.ai.controller;

import com.shopora.ai.dto.AssistantRequest;
import com.shopora.ai.dto.AssistantResponse;
import com.shopora.ai.service.AssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint public (côté usage) de l'assistant IA : reçoit une question
 * en langage naturel, retourne une réponse générée via RAG.
 */
@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    @PostMapping("/ask")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<AssistantResponse> askAssistant(@Valid @RequestBody AssistantRequest request) {
        return ResponseEntity.ok(assistantService.askAssistant(request));
    }
}