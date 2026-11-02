package com.shopora.groupbuying.controller;

import com.shopora.groupbuying.dto.CreateSessionRequest;
import com.shopora.groupbuying.dto.SessionResponse;
import com.shopora.groupbuying.dto.UpdateSessionRequest;
import com.shopora.groupbuying.service.GroupBuySessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // Nouveau : sessions du vendeur connecté (utilisé par le dashboard vendeur)
    @GetMapping("/my-sessions")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<List<SessionResponse>> getMySessions(@AuthenticationPrincipal String vendorEmail) {
        return ResponseEntity.ok(sessionService.getMySessions(vendorEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }

    // Modifier SA session (active et sans participant uniquement)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<SessionResponse> updateSession(@PathVariable Long id,
                                                         @Valid @RequestBody UpdateSessionRequest request,
                                                         @AuthenticationPrincipal String vendorEmail) {
        return ResponseEntity.ok(sessionService.updateSession(id, request, vendorEmail));
    }

    // Supprimer (aucun participant) ou annuler (avec remboursement) SA session
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id,
                                              @AuthenticationPrincipal String vendorEmail) {
        sessionService.deleteSession(id, vendorEmail);
        return ResponseEntity.noContent().build();
    }
}