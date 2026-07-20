package com.shopora.auth.service;

import com.shopora.auth.dto.AuthResponse;
import com.shopora.auth.dto.LoginRequest;
import com.shopora.auth.dto.RegisterRequest;
import com.shopora.auth.entity.Role;
import com.shopora.auth.entity.User;
import com.shopora.auth.repository.UserRepository;
import com.shopora.auth.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Logique métier de l'authentification : inscription et connexion.
 * C'est ici que l'on assemble JwtUtils, PasswordEncoder, UserRepository
 * pour produire un résultat exploitable par le Controller.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    /**
     * Inscription d'un nouvel utilisateur.
     */
    public AuthResponse register(RegisterRequest request) {

        // Vérifie l'unicité de l'email AVANT de tenter l'insertion en base
        // (sinon JPA lèverait une exception SQL moins lisible pour le frontend)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé.");
        }

        // SÉCURITÉ : on ignore volontairement le rôle envoyé par le frontend s'il
        // correspond à ADMIN. Seuls CLIENT et VENDOR peuvent être choisis librement
        // à l'inscription publique. Un compte ADMIN ne peut être créé que manuellement
        // en base de données (ou via un futur endpoint protégé réservé aux ADMIN existants).
        Role safeRole = request.getRole() == Role.ADMIN ? Role.CLIENT : request.getRole();

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // hash BCrypt, jamais en clair
                .role(safeRole)
                .build();

        userRepository.save(user);

        // Connecte directement l'utilisateur après inscription (meilleure UX :
        // pas besoin de se reconnecter juste après avoir créé son compte)
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    /**
     * Connexion d'un utilisateur existant.
     */
    public AuthResponse login(LoginRequest request) {

        // Délègue la vérification email/mot de passe à Spring Security
        // (via authenticationProvider défini dans SecurityConfig).
        // Si les identifiants sont incorrects, une exception est levée automatiquement
        // (BadCredentialsException), interceptée plus tard par un gestionnaire global d'erreurs.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // À ce stade, l'authentification a réussi : on peut récupérer l'utilisateur en confiance.
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}