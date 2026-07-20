package com.shopora.groupbuying.entity;

/**
 * Cycle de vie d'une session d'achat groupé.
 *
 * ACTIVE     : la session est ouverte, les clients peuvent encore la rejoindre.
 * SUCCESSFUL : le nombre cible de participants a été atteint AVANT l'expiration
 *              du timer -> toutes les pré-autorisations sont capturées (débitées).
 * FAILED     : le timer a expiré SANS atteindre le nombre cible
 *              -> toutes les pré-autorisations sont libérées (remboursées).
 *
 * C'est le scheduler (créé plus tard) qui fait basculer une session
 * de ACTIVE vers SUCCESSFUL ou FAILED, jamais l'utilisateur directement.
 */
public enum SessionStatus {
    ACTIVE,
    SUCCESSFUL,
    FAILED
}