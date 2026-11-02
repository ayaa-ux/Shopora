package com.shopora.groupbuying.controller;

import com.shopora.groupbuying.dto.AdminSessionStatsResponse;
import com.shopora.groupbuying.dto.SessionResponse;
import com.shopora.groupbuying.service.GroupBuySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Supervision des achats groupés par l'administrateur (ADMIN uniquement). */
@RestController
@RequestMapping("/api/sessions/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSessionController {

    private final GroupBuySessionService sessionService;

    @GetMapping("/all")
    public ResponseEntity<List<SessionResponse>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminSessionStatsResponse> getStats() {
        return ResponseEntity.ok(sessionService.getAdminStats());
    }

    /** Annule une session ACTIVE : les clients sont remboursés (pré-autorisations libérées). */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelSession(@PathVariable Long id) {
        sessionService.cancelSessionAsAdmin(id);
        return ResponseEntity.noContent().build();
    }
}
