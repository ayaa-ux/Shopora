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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final GroupBuySessionRepository sessionRepository;
    private final PaymentSimulationService paymentSimulationService;
    private final GroupBuySessionService groupBuySessionService;

    /**
     * Transactionnel + verrou pessimiste sur la session : deux clients qui
     * rejoignent en même temps sont traités l'un après l'autre.
     */
    @Transactional
    public ParticipationResponse joinSession(Long sessionId, String clientEmail) {

        GroupBuySession session = sessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable."));

        if (session.getStatus() != SessionStatus.ACTIVE
                || !session.getEndTime().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("Cette session n'est plus active.");
        }

        if (participationRepository.existsBySessionIdAndClientEmail(sessionId, clientEmail)) {
            throw new IllegalStateException("Vous participez déjà à cette session.");
        }

        if (session.getCurrentParticipants() >= session.getTargetParticipants()) {
            throw new IllegalStateException("Cette session a déjà atteint son objectif de participants.");
        }

        String preAuthReference = paymentSimulationService.authorize(clientEmail, session.getGroupPrice());
        if (preAuthReference == null) {
            throw new IllegalStateException("La pré-autorisation bancaire a été refusée par votre banque.");
        }

        Participation participation = Participation.builder()
                .session(session)
                .clientEmail(clientEmail)
                .preAuthStatus(PreAuthStatus.AUTHORIZED)
                .preAuthReference(preAuthReference)
                .build();
        participationRepository.save(participation);

        session.setCurrentParticipants(session.getCurrentParticipants() + 1);
        sessionRepository.save(session);

        if (session.getCurrentParticipants() >= session.getTargetParticipants()) {
            // resolveAsSuccessful diffuse lui-même l'état final (un seul message)
            groupBuySessionService.resolveAsSuccessful(session);
            participation.setPreAuthStatus(PreAuthStatus.CAPTURED);
        } else {
            groupBuySessionService.broadcastSessionUpdate(session);
        }

        return mapToResponse(participation);
    }

    @Transactional(readOnly = true)
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