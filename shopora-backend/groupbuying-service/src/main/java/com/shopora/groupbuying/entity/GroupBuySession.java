package com.shopora.groupbuying.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Représente une session d'achat groupé pour UNE offre vendeur précise.
 *
 * Exemple concret : "Achetez ce sac à 199 MAD au lieu de 299 MAD
 * si 20 personnes rejoignent dans les 24h" -> targetParticipants = 20,
 * groupPrice = 199, endTime = maintenant + 24h.
 *
 * Pas de relation JPA vers ProductOffer (catalog-service) : on stocke
 * juste son ID, conformément au principe "Database per Service"
 * déjà appliqué entre auth-service et catalog-service.
 */
@Entity
@Table(name = "group_buy_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupBuySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Référence vers l'offre du catalogue concernée (pas de FK inter-services)
    @Column(nullable = false)
    private Long productOfferId;

    // Email du vendeur qui a lancé cette session (extrait du JWT à la création)
    @Column(nullable = false)
    private String vendorEmail;

    // Nombre de participants nécessaires pour que la session réussisse
    @Column(nullable = false)
    private Integer targetParticipants;

    // Compteur mis à jour en temps réel à chaque nouvelle participation.
    // C'est CE champ qui est diffusé via WebSocket à tous les clients connectés.
    @Column(nullable = false)
    @Builder.Default
    private Integer currentParticipants = 0;

    // Prix unitaire garanti SI la session réussit (généralement inférieur
    // au prix normal de l'offre, c'est l'incitation à participer)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal groupPrice;

    @Column(nullable = false)
    private LocalDateTime startTime;

    // Date limite : passé ce moment, le scheduler résout automatiquement
    // la session en SUCCESSFUL ou FAILED selon currentParticipants
    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}