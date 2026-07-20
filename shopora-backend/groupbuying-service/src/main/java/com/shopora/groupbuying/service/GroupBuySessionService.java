package com.shopora.groupbuying.service;

import com.shopora.groupbuying.dto.CreateSessionRequest;
import com.shopora.groupbuying.dto.SessionResponse;
import com.shopora.groupbuying.entity.GroupBuySession;
import com.shopora.groupbuying.entity.Participation;
import com.shopora.groupbuying.entity.PreAuthStatus;
import com.shopora.groupbuying.entity.SessionStatus;
import com.shopora.groupbuying.repository.GroupBuySessionRepository;
import com.shopora.groupbuying.repository.ParticipationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Logique métier des sessions d'achat groupé : création, consultation,
 * et surtout RÉSOLUTION (succès ou échec). C'est ce fichier qui contient
 * la logique partagée entre 2 déclencheurs différents :
 * 1. Résolution immédiate quand le dernier participant rejoint
 *    (déclenchée par ParticipationService, étape suivante)
 * 2. Résolution par expiration du timer (déclenchée par le scheduler, plus tard)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroupBuySessionService {

    private final GroupBuySessionRepository sessionRepository;
    private final ParticipationRepository participationRepository;
    private final PaymentSimulationService paymentSimulationService;
    private final SimpMessagingTemplate messagingTemplate;

    public SessionResponse createSession(CreateSessionRequest request, String vendorEmail) {
        LocalDateTime now = LocalDateTime.now();

        GroupBuySession session = GroupBuySession.builder()
                .productOfferId(request.getProductOfferId())
                .vendorEmail(vendorEmail)
                .targetParticipants(request.getTargetParticipants())
                .groupPrice(request.getGroupPrice())
                .startTime(now)
                .endTime(now.plusHours(request.getDurationHours()))
                .build();

        sessionRepository.save(session);
        return mapToResponse(session);
    }

    public void broadcastSessionUpdate(GroupBuySession session) {
        messagingTemplate.convertAndSend(
                "/topic/sessions/" + session.getId(),
                mapToResponse(session)
        );
    }

    public List<SessionResponse> getActiveSessions() {
        return sessionRepository.findByStatus(SessionStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SessionResponse getSessionById(Long id) {
        GroupBuySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable."));
        return mapToResponse(session);
    }

    /**
     * Résout une session en SUCCÈS : capture définitivement (débite)
     * la pré-autorisation de CHAQUE participant.
     * Appelée soit immédiatement quand le dernier participant rejoint
     * (ParticipationService), soit par le scheduler si le timer expire
     * alors que la cible était déjà atteinte (cas limite de sécurité).
     */
    public void resolveAsSuccessful(GroupBuySession session) {
        session.setStatus(SessionStatus.SUCCESSFUL);
        sessionRepository.save(session);

        List<Participation> participations = participationRepository.findBySessionId(session.getId());
        for (Participation participation : participations) {
            paymentSimulationService.capture(participation.getPreAuthReference());
            participation.setPreAuthStatus(PreAuthStatus.CAPTURED);
            participationRepository.save(participation);
        }
        broadcastSessionUpdate(session);

        log.info("Session {} résolue en SUCCESSFUL - {} participant(s) débité(s)",
                session.getId(), participations.size());
    }

    /**
     * Résout une session en ÉCHEC : libère (rembourse) la pré-autorisation
     * de CHAQUE participant, sans jamais les débiter.
     * Appelée uniquement par le scheduler (étape suivante), quand le timer
     * expire sans que la cible de participants ait été atteinte.
     */
    public void resolveAsFailed(GroupBuySession session) {
        session.setStatus(SessionStatus.FAILED);
        sessionRepository.save(session);

        List<Participation> participations = participationRepository.findBySessionId(session.getId());
        for (Participation participation : participations) {
            paymentSimulationService.release(participation.getPreAuthReference());
            participation.setPreAuthStatus(PreAuthStatus.RELEASED);
            participationRepository.save(participation);
        }

        log.info("Session {} résolue en FAILED - {} participant(s) remboursé(s)",
                session.getId(), participations.size());
    }

    /**
     * Convertit l'entité en DTO, en calculant le temps restant en secondes.
     * Calcul fait à CHAQUE appel (jamais stocké) pour rester toujours exact,
     * peu importe quand le frontend interroge l'API.
     */
    SessionResponse mapToResponse(GroupBuySession session) {
        long remainingSeconds = Duration.between(LocalDateTime.now(), session.getEndTime()).getSeconds();
        if (remainingSeconds < 0) {
            remainingSeconds = 0; // Le timer ne doit jamais afficher de nombre négatif côté frontend
        }

        return SessionResponse.builder()
                .id(session.getId())
                .productOfferId(session.getProductOfferId())
                .vendorEmail(session.getVendorEmail())
                .targetParticipants(session.getTargetParticipants())
                .currentParticipants(session.getCurrentParticipants())
                .groupPrice(session.getGroupPrice())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .remainingSeconds(remainingSeconds)
                .build();
    }
}