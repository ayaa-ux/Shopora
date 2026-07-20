package com.shopora.groupbuying.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Représente l'engagement d'UN client dans UNE session d'achat groupé,
 * avec l'état de sa pré-autorisation bancaire associée.
 *
 * Contrairement à ProductOffer (catalog-service), ici une vraie relation
 * JPA @ManyToOne vers GroupBuySession a du sens, car les deux entités
 * vivent dans LA MÊME base de données (shopora_groupbuying) -> ce n'est
 * pas une frontière de microservice, juste une relation classique
 * à l'intérieur d'un seul service.
 */
@Entity
@Table(name = "participations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Participation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GroupBuySession session;

    // Email du client participant (extrait du JWT, jamais envoyé par le frontend)
    @Column(nullable = false)
    private String clientEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PreAuthStatus preAuthStatus = PreAuthStatus.PENDING;

    // Référence de transaction simulée (équivalent d'un ID Stripe/CMI réel),
    // générée par PaymentSimulationService -> permet de tracer chaque opération
    // comme dans un vrai relevé bancaire.
    private String preAuthReference;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.joinedAt == null) {
            this.joinedAt = LocalDateTime.now();
        }
    }
}