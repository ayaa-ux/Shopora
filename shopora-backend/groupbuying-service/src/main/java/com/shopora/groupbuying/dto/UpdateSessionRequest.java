package com.shopora.groupbuying.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO de modification d'une session par son vendeur.
 * L'offre concernée (productOfferId) n'est volontairement pas modifiable :
 * pour changer d'offre, on supprime la session et on en crée une nouvelle.
 */
@Data
public class UpdateSessionRequest {

    @NotNull(message = "Le nombre de participants cible est obligatoire")
    @Min(value = 2, message = "Une session doit cibler au moins 2 participants")
    private Integer targetParticipants;

    @NotNull(message = "Le prix groupé est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix groupé doit être supérieur à 0")
    private BigDecimal groupPrice;

    // La durée repart de l'instant de la modification
    @NotNull(message = "La durée de la session est obligatoire")
    @Min(value = 1, message = "La session doit durer au moins 1 heure")
    private Integer durationHours;
}
