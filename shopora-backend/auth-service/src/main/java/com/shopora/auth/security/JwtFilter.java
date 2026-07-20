package com.shopora.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre exécuté UNE FOIS par requête HTTP (avant qu'elle n'atteigne le Controller).
 * Son rôle : lire le header "Authorization: Bearer <token>", vérifier le token,
 * et si valide, authentifier la requête auprès de Spring Security.
 *
 * C'est ce filtre qui remplace la notion classique de "session" :
 * ShopOra est STATELESS -> aucune session n'est stockée côté serveur,
 * tout repose sur la validité du token envoyé à chaque requête.
 */
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Pas de token fourni -> on laisse passer sans authentifier.
        // SecurityConfig décidera ensuite si la route demandée exige une authentification.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7); // retire le préfixe "Bearer "
        final String email = jwtUtils.isTokenValid(token) ? jwtUtils.extractEmail(token) : null;

        // On authentifie seulement si : token valide ET aucune authentification déjà en place
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // C'est cette ligne qui "connecte" officiellement l'utilisateur pour cette requête
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response); // passe la main au filtre/controller suivant
    }
}