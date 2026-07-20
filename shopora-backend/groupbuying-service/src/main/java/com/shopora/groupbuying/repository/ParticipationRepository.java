package com.shopora.groupbuying.repository;

import com.shopora.groupbuying.entity.Participation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Accès à la table "participations".
 */
public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    /**
     * Empêche un même client de rejoindre deux fois la même session
     * (règle métier évoquée à l'étape précédente). Vérifiée AVANT
     * toute création de Participation dans le service.
     */
    boolean existsBySessionIdAndClientEmail(Long sessionId, String clientEmail);

    /**
     * Liste de tous les participants d'une session -> utilisée par le
     * scheduler pour capturer (succès) ou libérer (échec) chaque
     * pré-autorisation au moment de la résolution.
     */
    List<Participation> findBySessionId(Long sessionId);

    /**
     * Historique des participations d'un client (page "Mes achats groupés").
     */
    List<Participation> findByClientEmail(String clientEmail);
}