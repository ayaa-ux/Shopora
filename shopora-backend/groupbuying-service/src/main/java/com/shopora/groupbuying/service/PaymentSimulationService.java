package com.shopora.groupbuying.service;

import com.shopora.groupbuying.entity.PreAuthStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Simule le comportement d'une vraie passerelle de paiement (type Stripe ou CMI)
 * pour la pré-autorisation bancaire du module Group Buying.
 *
 * IMPORTANT (point à expliquer en soutenance) : aucune vraie transaction
 * bancaire n'a lieu ici. Ce service reproduit fidèlement les 3 opérations
 * réelles d'une carte bancaire :
 *   1. authorize() : bloque le montant sur la carte sans le débiter
 *      (équivalent de Stripe PaymentIntent.confirm() en mode "manual capture")
 *   2. capture()   : débite réellement le montant bloqué (session réussie)
 *   3. release()   : annule le blocage, l'argent redevient disponible
 *      (session échouée -> remboursement automatique)
 *
 * Avantage de cette architecture : le jour où un vrai connecteur Stripe/CMI
 * est intégré, seul CE fichier change. Aucun autre service (ParticipationService,
 * GroupBuySessionService, scheduler...) n'a besoin d'être modifié, car ils
 * dépendent uniquement de la signature de ces 3 méthodes, jamais de leur
 * implémentation interne.
 */
@Service
@Slf4j // Lombok : génère un logger nommé "log" automatiquement (raccourci pratique)
public class PaymentSimulationService {

    /**
     * Simule la demande de pré-autorisation auprès de la banque du client.
     *
     * Dans un vrai système, cet appel partirait vers une API externe (Stripe...)
     * et pourrait échouer (carte refusée, fonds insuffisants). Ici, on simule
     * un taux de réussite réaliste de 95% pour rendre les tests plus proches
     * de la réalité, plutôt que de toujours retourner un succès garanti.
     *
     * @return une référence de transaction simulée si succès, null si échec
     */
    public String authorize(String clientEmail, BigDecimal amount) {
        // Génère une référence unique, au même format qu'une vraie référence
        // de transaction bancaire (préfixe + UUID tronqué pour rester lisible).
        String reference = "PREAUTH-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        // Simulation d'un taux d'échec de 5% (carte refusée, fonds insuffisants...)
        boolean success = Math.random() > 0.05;

        if (success) {
            log.info("Pré-autorisation RÉUSSIE pour {} - Montant: {} MAD - Référence: {}",
                    clientEmail, amount, reference);
            return reference;
        } else {
            log.warn("Pré-autorisation ÉCHOUÉE pour {} - Montant: {} MAD (carte refusée simulée)",
                    clientEmail, amount);
            return null;
        }
    }

    /**
     * Simule la capture définitive d'un montant déjà pré-autorisé.
     * Appelée par le scheduler quand une session atteint son objectif
     * AVANT l'expiration du timer (session SUCCESSFUL).
     *
     * Dans un vrai système : appel à l'API de capture de la passerelle
     * (ex: stripe.paymentIntents.capture(reference)).
     */
    public boolean capture(String preAuthReference) {
        log.info("Capture du montant pour la référence {} -> client définitivement débité", preAuthReference);
        // Simulation : la capture réussit toujours si la pré-autorisation existait,
        // car l'argent était déjà bloqué à l'étape authorize().
        return true;
    }

    /**
     * Simule la libération d'un montant pré-autorisé, sans le débiter.
     * Appelée par le scheduler quand une session expire SANS avoir atteint
     * son objectif de participants (session FAILED) -> remboursement automatique.
     *
     * Dans un vrai système : appel à l'API d'annulation de la passerelle
     * (ex: stripe.paymentIntents.cancel(reference)).
     */
    public boolean release(String preAuthReference) {
        log.info("Libération du montant pour la référence {} -> fonds redevenus disponibles pour le client",
                preAuthReference);
        return true;
    }
}