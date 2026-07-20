package com.shopora.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO renvoyé au frontend après une inscription ou connexion réussie.
 *
 * Le frontend (Zustand authStore) stockera ce token + ces infos pour :
 * 1. Joindre le token JWT à chaque requête Axios (header Authorization).
 * 2. Afficher dynamiquement l'UI selon le rôle (ex: bouton "Ajouter un produit"
 *    visible uniquement si role === "VENDOR").
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Long userId;
    private String fullName;
    private String email;
    private String role; // Envoyé en String pour rester simple côté JS (pas d'enum JS natif)
}