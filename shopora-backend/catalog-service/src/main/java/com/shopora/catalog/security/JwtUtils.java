package com.shopora.catalog.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.function.Function;

/**
 * Version allégée de JwtUtils par rapport à auth-service.
 *
 * Différence importante : catalog-service ne génère JAMAIS de token
 * (seul auth-service a ce droit). Il sait uniquement les LIRE et les VÉRIFIER.
 * Pas de méthode generateToken() ici, volontairement.
 */
@Component
public class JwtUtils {

    // MÊME valeur que dans application.yml de auth-service : c'est ce secret
    // partagé qui permet à catalog-service de vérifier une signature
    // qu'il n'a pourtant jamais créée lui-même.
    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}