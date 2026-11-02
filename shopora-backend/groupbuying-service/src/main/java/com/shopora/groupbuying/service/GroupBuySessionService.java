package com.shopora.groupbuying.service;

import com.shopora.groupbuying.dto.AdminSessionStatsResponse;
import com.shopora.groupbuying.dto.CreateSessionRequest;
import com.shopora.groupbuying.dto.SessionResponse;
import com.shopora.groupbuying.dto.UpdateSessionRequest;
import com.shopora.groupbuying.entity.GroupBuySession;
import com.shopora.groupbuying.entity.Participation;
import com.shopora.groupbuying.entity.PreAuthStatus;
import com.shopora.groupbuying.entity.SessionStatus;
import com.shopora.groupbuying.repository.GroupBuySessionRepository;
import com.shopora.groupbuying.repository.ParticipationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    public List<SessionResponse> getActiveSessions() {
        return sessionRepository.findByStatus(SessionStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<SessionResponse> getMySessions(String vendorEmail) {
        return sessionRepository.findByVendorEmailOrderByCreatedAtDesc(vendorEmail).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SessionResponse getSessionById(Long id) {
        GroupBuySession session = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable."));
        return mapToResponse(session);
    }

    /**
     * Diffuse l'état de la session APRÈS le commit de la transaction en cours,
     * pour que les clients ne reçoivent jamais un état qui sera ensuite annulé (rollback).
     */
    public void broadcastSessionUpdate(GroupBuySession session) {
        SessionResponse payload = mapToResponse(session);
        Runnable send = () -> messagingTemplate.convertAndSend("/topic/sessions/" + payload.getId(), payload);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    @Transactional
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

    @Transactional
    public void resolveAsFailed(GroupBuySession session) {
        session.setStatus(SessionStatus.FAILED);
        sessionRepository.save(session);

        List<Participation> participations = participationRepository.findBySessionId(session.getId());
        for (Participation participation : participations) {
            paymentSimulationService.release(participation.getPreAuthReference());
            participation.setPreAuthStatus(PreAuthStatus.RELEASED);
            participationRepository.save(participation);
        }
        // Avant : aucun broadcast en cas d'échec -> les écrans restaient "ACTIVE".
        broadcastSessionUpdate(session);

        log.info("Session {} résolue en FAILED - {} participant(s) remboursé(s)",
                session.getId(), participations.size());
    }

    /**
     * Résolution d'UNE session expirée, dans sa propre transaction, avec verrou.
     * Idempotent : si la session a déjà été résolue entre-temps, il ne se passe rien.
     */
    @Transactional
    public void resolveExpiredSession(Long sessionId) {
        sessionRepository.findByIdForUpdate(sessionId).ifPresent(session -> {
            if (session.getStatus() != SessionStatus.ACTIVE
                    || session.getEndTime().isAfter(LocalDateTime.now())) {
                return;
            }
            if (session.getCurrentParticipants() >= session.getTargetParticipants()) {
                resolveAsSuccessful(session);
            } else {
                resolveAsFailed(session);
            }
        });
    }

    /**
     * Modification d'une session par SON vendeur.
     * Règle métier : uniquement tant que la session est ACTIVE et SANS participant,
     * sinon on changerait les conditions après l'engagement (et la pré-autorisation)
     * des clients.
     */
    @Transactional
    public SessionResponse updateSession(Long id, UpdateSessionRequest request, String vendorEmail) {
        GroupBuySession session = loadOwnedSessionForUpdate(id, vendorEmail);

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Seule une session active peut être modifiée.");
        }
        if (participationRepository.findBySessionId(id).size() > 0) {
            throw new IllegalStateException(
                    "Cette session a déjà des participants : elle ne peut plus être modifiée. "
                            + "Vous pouvez l'annuler (les clients seront remboursés).");
        }

        LocalDateTime now = LocalDateTime.now();
        session.setTargetParticipants(request.getTargetParticipants());
        session.setGroupPrice(request.getGroupPrice());
        session.setStartTime(now);
        session.setEndTime(now.plusHours(request.getDurationHours()));
        sessionRepository.save(session);

        broadcastSessionUpdate(session);
        return mapToResponse(session);
    }

    /**
     * Suppression / annulation d'une session par SON vendeur.
     * - ACTIVE avec participants : annulation -> pré-autorisations libérées (remboursement),
     *   la session passe en FAILED et reste visible dans l'historique.
     * - Sans aucun participant : suppression définitive.
     * - SUCCESSFUL : interdit (les clients ont déjà été débités).
     */
    @Transactional
    public void deleteSession(Long id, String vendorEmail) {
        GroupBuySession session = loadOwnedSessionForUpdate(id, vendorEmail);

        if (session.getStatus() == SessionStatus.SUCCESSFUL) {
            throw new IllegalStateException("Une session réussie ne peut pas être supprimée.");
        }

        boolean hasParticipants = !participationRepository.findBySessionId(id).isEmpty();

        if (!hasParticipants) {
            sessionRepository.delete(session);
            log.info("Session {} supprimée par {}", id, vendorEmail);
        } else if (session.getStatus() == SessionStatus.ACTIVE) {
            resolveAsFailed(session);
            log.info("Session {} annulée par {} (participants remboursés)", id, vendorEmail);
        } else {
            throw new IllegalStateException(
                    "Cette session terminée contient un historique de participants : elle est conservée.");
        }
    }

    // ─── Administration ───────────────────────────────────────────────────────

    public List<SessionResponse> getAllSessions() {
        return sessionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public AdminSessionStatsResponse getAdminStats() {
        long active = sessionRepository.countByStatus(SessionStatus.ACTIVE);
        long successful = sessionRepository.countByStatus(SessionStatus.SUCCESSFUL);
        long failed = sessionRepository.countByStatus(SessionStatus.FAILED);
        long finished = successful + failed;
        long rate = finished == 0 ? 0 : Math.round(successful * 100.0 / finished);

        Map<String, Long> byPayment = new LinkedHashMap<>();
        for (PreAuthStatus status : PreAuthStatus.values()) {
            byPayment.put(status.name(), participationRepository.countByPreAuthStatus(status));
        }

        return new AdminSessionStatsResponse(active + successful + failed, active, successful, failed,
                rate, participationRepository.count(), byPayment);
    }

    /** Annulation par l'admin : uniquement une session ACTIVE (les clients sont remboursés). */
    @Transactional
    public void cancelSessionAsAdmin(Long id) {
        GroupBuySession session = sessionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable."));
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Seule une session active peut être annulée.");
        }
        resolveAsFailed(session);
        log.info("Session {} annulée par l'administrateur (participants remboursés)", id);
    }

    private GroupBuySession loadOwnedSessionForUpdate(Long id, String vendorEmail) {
        GroupBuySession session = sessionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable."));
        if (!session.getVendorEmail().equalsIgnoreCase(vendorEmail)) {
            throw new AccessDeniedException("Cette session ne vous appartient pas.");
        }
        return session;
    }

    SessionResponse mapToResponse(GroupBuySession session) {
        long remainingSeconds = Duration.between(LocalDateTime.now(), session.getEndTime()).getSeconds();
        if (remainingSeconds < 0) {
            remainingSeconds = 0;
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