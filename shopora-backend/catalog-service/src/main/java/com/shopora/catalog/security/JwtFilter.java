package com.shopora.catalog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Différence majeure avec JwtFilter de auth-service :
 * ici, on n'appelle PAS de UserDetailsService (pas de base "users" disponible).
 * On construit directement l'authentification à partir des claims du token
 * (email + role), car catalog-service fait confiance à la signature JWT
 * émise par auth-service -> il n'a pas besoin de revérifier l'existence
 * de l'utilisateur en base à chaque requête.
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        if (jwtUtils.isTokenValid(token)) {
            String email = jwtUtils.extractEmail(token);
            String role = jwtUtils.extractRole(token);

            // Construction directe de l'autorité Spring Security à partir
            // du claim "role" du token (ex: "VENDOR" -> "ROLE_VENDOR").
            // Aucun appel base de données : c'est ce qui rend ce service
            // totalement indépendant de auth-service au moment de l'exécution.
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

            var authToken = new UsernamePasswordAuthenticationToken(email, null, authorities);
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        // Si le token est invalide ou absent, on laisse simplement passer sans authentifier :
        // SecurityConfig décidera ensuite si la route exige une authentification.

        filterChain.doFilter(request, response);
    }
}