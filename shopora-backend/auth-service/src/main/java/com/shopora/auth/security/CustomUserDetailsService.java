package com.shopora.auth.security;

import com.shopora.auth.entity.User;
import com.shopora.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Pont entre notre entité métier "User" (entity/User.java) et le format
 * "UserDetails" que Spring Security comprend et manipule en interne.
 *
 * C'est ICI qu'on transforme notre Role (CLIENT/VENDOR/ADMIN) en autorité
 * Spring Security au format "ROLE_CLIENT", "ROLE_VENDOR", "ROLE_ADMIN"
 * (préfixe "ROLE_" obligatoire, c'est une convention stricte de Spring Security).
 */
@Service
@RequiredArgsConstructor // Lombok génère le constructeur avec userRepository en paramètre (injection)
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Utilisateur introuvable avec l'email : " + email));

        // On utilise la classe "User" native de Spring Security (différente de notre entité)
        // pour construire un objet UserDetails standard, sans avoir à créer notre propre classe.
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword()) // déjà hashé en BCrypt, stocké tel quel
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .disabled(!user.isEnabled())
                .build();
    }
}