package com.shopora.groupbuying.dto;

import com.shopora.groupbuying.entity.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO renvoyé au frontend pour afficher une session d'achat groupé.
 *
 * "remainingSeconds" est calculé côté service (jamais stocké en base) :
 * c'est la valeur que React utilise pour afficher et faire défiler
 * le timer countdown en temps réel sur la carte de session.
 * Calculé à chaque appel REST, puis re-synchronisé en continu via WebSocket
 * (voir module websocket/ plus tard).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {

    private Long id;
    private Long productOfferId;
    private String vendorEmail;
    private Integer targetParticipants;
    private Integer currentParticipants;
    private BigDecimal groupPrice;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private SessionStatus status;
    private Long remainingSeconds;
}