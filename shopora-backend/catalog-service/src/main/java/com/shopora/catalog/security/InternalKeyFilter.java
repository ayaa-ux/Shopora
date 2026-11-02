package com.shopora.catalog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

/**
 * Authentifie les appels service-à-service (order-service) sur /api/offers/internal/**
 * grâce à la clé partagée X-Internal-Key. L'api-gateway supprime cet en-tête des requêtes
 * venant d'Internet : seul un service du réseau Docker peut donc l'envoyer.
 */
@Component
public class InternalKeyFilter extends OncePerRequestFilter {

    private static final String PREFIX = "/api/offers/internal/";

    private final byte[] expectedKey;

    public InternalKeyFilter(@Value("${internal.api-key:shopora-internal-dev-key}") String internalKey) {
        this.expectedKey = internalKey.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        if (request.getRequestURI().startsWith(PREFIX)) {
            String provided = request.getHeader("X-Internal-Key");
            // comparaison en temps constant
            if (provided != null && MessageDigest.isEqual(provided.getBytes(StandardCharsets.UTF_8), expectedKey)) {
                var auth = new UsernamePasswordAuthenticationToken(
                        "internal-service", null, List.of(new SimpleGrantedAuthority("ROLE_INTERNAL")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}
