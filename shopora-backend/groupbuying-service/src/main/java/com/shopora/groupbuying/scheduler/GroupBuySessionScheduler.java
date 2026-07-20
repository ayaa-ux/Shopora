package com.shopora.groupbuying.scheduler;

import com.shopora.groupbuying.entity.GroupBuySession;
import com.shopora.groupbuying.entity.SessionStatus;
import com.shopora.groupbuying.repository.GroupBuySessionRepository;
import com.shopora.groupbuying.service.GroupBuySessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Tâche planifiée qui résout AUTOMATIQUEMENT les sessions d'achat groupé
 * dont le timer a expiré, sans aucune action humaine nécessaire.
 *
 * C'est la pièce qui rend le module "intelligent" : un vendeur lance une
 * session et peut fermer son navigateur -> la résolution (succès ou échec,
 * capture ou remboursement) se produit même en son absence.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GroupBuySessionScheduler {

    private final GroupBuySessionRepository sessionRepository;
    private final GroupBuySessionService sessionService;

    /**
     * S'exécute toutes les 30 secondes (30 000 ms).
     *
     * Pourquoi 30 secondes et pas 1h ? Pour un projet de Bachelor, c'est
     * la fréquence idéale en démo : assez court pour que le jury voie une
     * session se résoudre automatiquement en direct pendant la soutenance
     * sans attendre, mais assez espacé pour ne pas surcharger la base
     * avec des requêtes inutiles.
     */
    @Scheduled(fixedRate = 30000)
    public void resolveExpiredSessions() {
        List<GroupBuySession> expiredSessions =
                sessionRepository.findByStatusAndEndTimeBefore(SessionStatus.ACTIVE, LocalDateTime.now());

        if (expiredSessions.isEmpty()) {
            return; // Rien à faire ce cycle-ci -> pas de log inutile pour ne pas polluer la console
        }

        log.info("Scheduler : {} session(s) expirée(s) détectée(s), résolution en cours...",
                expiredSessions.size());

        for (GroupBuySession session : expiredSessions) {
            // Décision clé : a-t-on atteint l'objectif au moment de l'expiration ?
            if (session.getCurrentParticipants() >= session.getTargetParticipants()) {
                // Cas limite rare : la cible a été atteinte exactement au même instant
                // que l'expiration, sans passer par la résolution immédiate de
                // ParticipationService (cas déjà couvert, mais on sécurise ici aussi).
                sessionService.resolveAsSuccessful(session);
            } else {
                sessionService.resolveAsFailed(session);
            }
        }
    }
}