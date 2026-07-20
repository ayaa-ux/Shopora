package com.shopora.auth.dto;

import com.shopora.auth.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Le nom complet est obligatoire")
    private String fullName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    // @NotNull (et non @NotBlank) : un enum n'est jamais une chaîne de caractères,
    // donc on vérifie seulement qu'il n'est pas null (c'est-à-dire que le JSON
    // envoyé par React contenait bien une valeur valide comme "CLIENT" ou "VENDOR").
    @NotNull(message = "Le rôle est obligatoire")
    private Role role;
}