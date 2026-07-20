package com.shopora.groupbuying.service;

import com.shopora.groupbuying.dto.ParticipationResponse;
import com.shopora.groupbuying.entity.GroupBuySession;
import com.shopora.groupbuying.entity.Participation;
import com.shopora.groupbuying.entity.PreAuthStatus;
import com.shopora.groupbuying.entity.SessionStatus;
import com.shopora.groupbuying.repository.GroupBuySessionRepository;
import com.shopora.groupbuying.repository.ParticipationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Logique métier de la participation à une session : rejoindre,
 * consulter son historique. C'est ici que la pré-autorisation bancaire
 * (PaymentSimulationService) est déclenchée pour chaque client.
 *
 * NOTE IMPORTANTE pour l'étape suivante : ce service ne diffuse PAS encore
 * la mise à jour du compteur via WebSocket -> on injectera SimpMessagingTemplate
 * ici une fois le module websocket/ créé, pour éviter de référencer un bean
 * qui n'existe pas encore à ce stade.
 */
@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final GroupBuySessionRepository sessionRepository;
    private final PaymentSimulationService paymentSimulationService;
    private final GroupBuySessionService groupBuySessionService;

    /**
     * Fait rejoindre un client à une session d'achat groupé.
     * Ordre des vérifications volontairement strict : chaque étape protège
     * contre un cas réel qui pourrait survenir en production.
     */
    public ParticipationResponse joinSession(Long sessionId, String clientEmail) {

        GroupBuySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable."));

        // 1. La session doit encore être active (pas déjà résolue)
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Cette session n'est plus active.");
        }

        // 2. Un client ne peut pas rejoindre deux fois la même session
        if (participationRepository.existsBySessionIdAndClientEmail(sessionId, clientEmail)) {
            throw new IllegalStateException("Vous participez déjà à cette session.");
        }

        // 3. Vérification défensive : la session ne doit pas déjà être pleine
        // (protège contre une requête arrivée juste avant la résolution automatique)
        if (session.getCurrentParticipants() >= session.getTargetParticipants()) {
            throw new IllegalStateException("Cette session a déjà atteint son objectif de participants.");
        }

        // 4. Déclenche la pré-autorisation bancaire (simulée)
        String preAuthReference = paymentSimulationService.authorize(clientEmail, session.getGroupPrice());
        if (preAuthReference == null) {
            throw new IllegalStateException("La pré-autorisation bancaire a été refusée par votre banque.");
        }

        // 5. Pré-autorisation réussie -> on enregistre officiellement la participation
        Participation participation = Participation.builder()
                .session(session)
                .clientEmail(clientEmail)
                .preAuthStatus(PreAuthStatus.AUTHORIZED)
                .preAuthReference(preAuthReference)
                .build();
        participationRepository.save(participation);

        // 6. Met à jour le compteur de la session
        session.setCurrentParticipants(session.getCurrentParticipants() + 1);
        sessionRepository.save(session);

        // Diffuse immédiatement le nouveau compteur à tous les clients connectés
// sur cette session, AVANT même de savoir si la cible est atteinte.
        groupBuySessionService.broadcastSessionUpdate(session);

        // 7. Résolution immédiate : si la cible est atteinte, pas besoin d'attendre
        // l'expiration du timer -> capture tout de suite toutes les pré-autorisations.
        if (session.getCurrentParticipants() >= session.getTargetParticipants()) {
            groupBuySessionService.resolveAsSuccessful(session);
            participation.setPreAuthStatus(PreAuthStatus.CAPTURED); // reflète l'état final dans la réponse
        }

        return mapToResponse(participation);
    }

    public List<ParticipationResponse> getMyParticipations(String clientEmail) {
        return participationRepository.findByClientEmail(clientEmail).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private ParticipationResponse mapToResponse(Participation participation) {
        return ParticipationResponse.builder()
                .id(participation.getId())
                .sessionId(participation.getSession().getId())
                .clientEmail(participation.getClientEmail())
                .preAuthStatus(participation.getPreAuthStatus())
                .preAuthReference(participation.getPreAuthReference())
                .joinedAt(participation.getJoinedAt())
                .build();
    }
}