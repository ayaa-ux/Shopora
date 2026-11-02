package com.shopora.orders.entity;

/**
 * Cycle de vie d'une ligne de commande, géré par le vendeur concerné.
 * L'ordre de déclaration compte : on ne peut avancer que d'une étape à la fois.
 */
public enum OrderStatus {
    ORDERED,    // Commandé
    CONFIRMED,  // Confirmé
    SHIPPED,    // Expédié
    DELIVERED   // Livré
}
