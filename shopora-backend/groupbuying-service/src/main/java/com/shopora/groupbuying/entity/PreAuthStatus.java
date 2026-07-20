package com.shopora.groupbuying.entity;

/**
 * État de la pré-autorisation bancaire d'UN client pour UNE participation.
 * Reproduit le cycle de vie réel d'une transaction par carte bancaire
 * (le même principe que Stripe/CMI utilisent en production) :
 *
 * PENDING    : la demande de pré-autorisation vient d'être envoyée.
 * AUTHORIZED : la banque a "bloqué" le montant sur la carte du client,
 *              sans le débiter encore (c'est la "pré-autorisation").
 * CAPTURED   : le montant a été réellement débité (session réussie).
 * RELEASED   : le blocage a été annulé, l'argent redevient disponible
 *              pour le client (session échouée -> remboursement automatique).
 * FAILED     : la pré-autorisation a été refusée par la banque
 *              (carte invalide, fonds insuffisants...).
 */
public enum PreAuthStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    RELEASED,
    FAILED
}