package com.shopora.orders.dto;

import com.shopora.orders.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.List;

/**
 * Commande envoyée par le client. Volontairement SANS prix ni vendeur : ces
 * informations sont relues dans le catalogue côté serveur, pour qu'un client
 * ne puisse pas modifier le prix depuis son navigateur.
 */
@Data
public class CreateOrderRequest {

    @Valid
    @NotEmpty(message = "Le panier est vide")
    private List<Item> items;

    @NotNull(message = "Le mode de paiement est obligatoire")
    private PaymentMethod paymentMethod;

    @NotBlank(message = "Obligatoire")
    private String firstName;

    @NotBlank(message = "Obligatoire")
    private String lastName;

    @NotBlank(message = "Obligatoire")
    private String address;

    @NotBlank(message = "Obligatoire")
    private String city;

    private String postalCode;

    @NotBlank(message = "Obligatoire")
    @Pattern(regexp = "^(\\+212|0)[5-7]\\d{8}$", message = "Numéro marocain invalide")
    private String phone;

    @Data
    public static class Item {

        // Dans le panier, "id" est l'identifiant de l'OFFRE vendeur
        @NotNull(message = "Offre obligatoire")
        private Long offerId;

        @NotNull(message = "Quantité obligatoire")
        @Min(value = 1, message = "Quantité minimale : 1")
        @Max(value = 50, message = "Quantité maximale : 50")
        private Integer quantity;
    }
}
