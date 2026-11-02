package com.shopora.auth.controller;

import com.shopora.auth.dto.AdminUserResponse;
import com.shopora.auth.dto.AdminUserStatsResponse;
import com.shopora.auth.entity.Role;
import com.shopora.auth.service.AdminUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestion des comptes par l'administrateur.
 * Toutes les routes exigent le rôle ADMIN (vérifié aussi côté serveur, pas seulement dans React).
 */
@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminUserService adminUserService;

    public record EnabledRequest(boolean enabled) { }

    public record RoleRequest(@NotNull(message = "Le rôle est obligatoire") Role role) { }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> getUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminUserStatsResponse> getStats() {
        return ResponseEntity.ok(adminUserService.getStats());
    }

    @PatchMapping("/users/{id}/enabled")
    public ResponseEntity<AdminUserResponse> setEnabled(@PathVariable Long id,
                                                        @RequestBody EnabledRequest request,
                                                        @AuthenticationPrincipal UserDetails admin) {
        return ResponseEntity.ok(adminUserService.setEnabled(id, request.enabled(), admin.getUsername()));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserResponse> setRole(@PathVariable Long id,
                                                     @Valid @RequestBody RoleRequest request,
                                                     @AuthenticationPrincipal UserDetails admin) {
        return ResponseEntity.ok(adminUserService.setRole(id, request.role(), admin.getUsername()));
    }
}
