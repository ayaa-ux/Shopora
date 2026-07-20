package com.shopora.groupbuying.dto;

import com.shopora.groupbuying.entity.PreAuthStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO renvoyé au frontend après qu'un client a rejoint une session,
 * ou pour afficher son historique de participations ("Mes achats groupés").
 *
 * Le champ "preAuthStatus" permet à React d'afficher clairement où en est
 * le client : "Montant bloqué" (AUTHORIZED), "Achat confirmé" (CAPTURED),
 * "Remboursé" (RELEASED)...
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationResponse {

    private Long id;
    private Long sessionId;
    private String clientEmail;
    private PreAuthStatus preAuthStatus;
    private String preAuthReference;
    private LocalDateTime joinedAt;
}