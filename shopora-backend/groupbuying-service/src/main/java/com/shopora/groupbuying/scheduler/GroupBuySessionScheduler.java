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
 * Résout automatiquement les sessions expirées (toutes les 30 s).
 * Chaque session est traitée dans sa propre transaction : l'échec d'une session
 * n'empêche plus la résolution des autres.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GroupBuySessionScheduler {

    private final GroupBuySessionRepository sessionRepository;
    private final GroupBuySessionService sessionService;

    @Scheduled(fixedRate = 30000)
    public void resolveExpiredSessions() {
        List<Long> expiredIds = sessionRepository
                .findByStatusAndEndTimeBefore(SessionStatus.ACTIVE, LocalDateTime.now())
                .stream()
                .map(GroupBuySession::getId)
                .toList();

        if (expiredIds.isEmpty()) {
            return;
        }

        log.info("Scheduler : {} session(s) expirée(s) détectée(s)", expiredIds.size());

        for (Long id : expiredIds) {
            try {
                sessionService.resolveExpiredSession(id);
            } catch (Exception e) {
                log.error("Échec de la résolution de la session {} (nouvel essai au prochain cycle)", id, e);
            }
        }
    }
}