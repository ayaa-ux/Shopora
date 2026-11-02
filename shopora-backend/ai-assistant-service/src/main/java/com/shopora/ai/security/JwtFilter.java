package com.shopora.ai.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    // Clé partagée avec catalog-service pour l'indexation automatique (service -> service).
    // À définir via la variable d'environnement INTERNAL_API_KEY en dehors du développement.
    @Value("${internal.api-key:shopora-internal-dev-key}")
    private String internalApiKey;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        // 1) Appel interne de catalog-service (jamais exposé : le gateway supprime cet en-tête)
        String internalKey = request.getHeader("X-Internal-Key");
        if (internalKey != null && MessageDigest.isEqual(
                internalKey.getBytes(StandardCharsets.UTF_8),
                internalApiKey.getBytes(StandardCharsets.UTF_8))) {

            var authToken = new UsernamePasswordAuthenticationToken(
                    "catalog-service", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
            SecurityContextHolder.getContext().setAuthentication(authToken);
            filterChain.doFilter(request, response);
            return;
        }

        // 2) Authentification classique par JWT
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        if (jwtUtils.isTokenValid(token)) {
            String email = jwtUtils.extractEmail(token);
            String role = jwtUtils.extractRole(token);

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
            var authToken = new UsernamePasswordAuthenticationToken(email, null, authorities);
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }
}