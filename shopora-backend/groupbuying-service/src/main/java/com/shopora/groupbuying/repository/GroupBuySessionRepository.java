package com.shopora.groupbuying.repository;

import com.shopora.groupbuying.entity.GroupBuySession;
import com.shopora.groupbuying.entity.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Accès à la table "group_buy_sessions".
 */
public interface GroupBuySessionRepository extends JpaRepository<GroupBuySession, Long> {

    /**
     * Retourne toutes les sessions actuellement actives (affichées au client
     * sur la page "Achats groupés en cours").
     */
    List<GroupBuySession> findByStatus(SessionStatus status);

    /**
     * Coeur du scheduler de résolution automatique (étape suivante) :
     * retourne toutes les sessions ACTIVE dont la date de fin est déjà dépassée.
     * Le scheduler appelle cette méthode toutes les X secondes pour savoir
     * lesquelles doivent être résolues (SUCCESSFUL ou FAILED).
     */
    List<GroupBuySession> findByStatusAndEndTimeBefore(SessionStatus status, LocalDateTime now);

    /**
     * Sessions liées à une offre précise du catalogue (utile pour afficher
     * "Cette offre a déjà une session d'achat groupé active" sur la fiche produit).
     */
    List<GroupBuySession> findByProductOfferIdAndStatus(Long productOfferId, SessionStatus status);
}