package com.shopora.groupbuying.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO reçu pour créer une nouvelle session d'achat groupé.
 * Envoyé par un VENDOR depuis son tableau de bord.
 */
@Data
public class CreateSessionRequest {

    @NotNull(message = "L'identifiant de l'offre est obligatoire")
    private Long productOfferId;

    @NotNull(message = "Le nombre de participants cible est obligatoire")
    @Min(value = 2, message = "Une session doit cibler au moins 2 participants")
    private Integer targetParticipants;

    @NotNull(message = "Le prix groupé est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix groupé doit être supérieur à 0")
    private java.math.BigDecimal groupPrice;

    // Durée de la session en heures (ex: 24) plutôt qu'une date de fin brute :
    // plus simple à manipuler côté formulaire React (un simple input numérique)
    // que de faire choisir une date/heure précise au vendeur.
    @NotNull(message = "La durée de la session est obligatoire")
    @Min(value = 1, message = "La session doit durer au moins 1 heure")
    private Integer durationHours;
}