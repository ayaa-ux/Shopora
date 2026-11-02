package com.shopora.auth.dto;

import java.time.LocalDateTime;

/** Vue d'un utilisateur pour l'administrateur (jamais le mot de passe). */
public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String role,
        boolean enabled,
        LocalDateTime createdAt) {
}
