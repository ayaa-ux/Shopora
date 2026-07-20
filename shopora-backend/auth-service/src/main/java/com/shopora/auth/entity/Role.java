package com.shopora.auth.entity;

/**
 * Les 3 rôles possibles d'un utilisateur sur ShopOra.
 * - CLIENT : achète, participe aux sessions Group Buying, utilise l'assistant IA.
 * - VENDOR : crée et gère son propre catalogue de produits.
 * - ADMIN  : supervise la plateforme (modération, validation des comptes...).
 */
public enum Role {
    CLIENT,
    VENDOR,
    ADMIN
}