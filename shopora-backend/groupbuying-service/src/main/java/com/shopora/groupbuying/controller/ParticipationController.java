package com.shopora.groupbuying.controller;

import com.shopora.groupbuying.dto.ParticipationResponse;
import com.shopora.groupbuying.service.ParticipationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST de la participation à une session.
 * Réservé au rôle CLIENT : un VENDOR n'a pas vocation à participer
 * à ses propres achats groupés (ni à ceux d'un concurrent).
 */
@RestController
@RequestMapping("/api/participations")
@RequiredArgsConstructor
public class ParticipationController {

    private final ParticipationService participationService;

    @PostMapping("/join/{sessionId}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ParticipationResponse> joinSession(@PathVariable Long sessionId,
                                                             @AuthenticationPrincipal String clientEmail) {
        ParticipationResponse response = participationService.joinSession(sessionId, clientEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-participations")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<ParticipationResponse>> getMyParticipations(
            @AuthenticationPrincipal String clientEmail) {
        return ResponseEntity.ok(participationService.getMyParticipations(clientEmail));
    }
}