package com.shopora.groupbuying.controller;

import com.shopora.groupbuying.dto.CreateSessionRequest;
import com.shopora.groupbuying.dto.SessionResponse;
import com.shopora.groupbuying.service.GroupBuySessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST des sessions d'achat groupé.
 * Création réservée au VENDOR ; consultation publique (un visiteur non
 * connecté doit pouvoir voir les sessions actives, mais pas y participer
 * sans être authentifié -> cette restriction est dans ParticipationController).
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class GroupBuySessionController {

    private final GroupBuySessionService sessionService;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request,
                                                         @AuthenticationPrincipal String vendorEmail) {
        SessionResponse response = sessionService.createSession(request, vendorEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/active")
    public ResponseEntity<List<SessionResponse>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }
}