package com.shopora.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

/**
 * Classe utilitaire responsable de TOUT ce qui touche au token JWT :
 * génération, extraction des informations, vérification de validité.
 *
 * C'est volontairement la SEULE classe qui manipule directement la librairie jjwt.
 * Le reste de l'application (filtre, service) passe par elle plutôt que de
 * manipuler les tokens JWT directement -> si on change un jour de librairie JWT,
 * on ne modifie qu'un seul fichier.
 */
@Component
public class JwtUtils {

    // Clé secrète utilisée pour signer les tokens, lue depuis application.yml.
    // Elle doit être identique pour TOUS les microservices qui valident des tokens
    // (catalog-service, groupbuying-service...), sinon ils ne pourront pas vérifier
    // la signature des tokens émis par auth-service.
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Durée de validité du token en millisecondes (ex: 24h), lue depuis application.yml.
    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Convertit la clé secrète (String) en objet SecretKey attendu par jjwt.
     * La clé doit faire au moins 256 bits (32 caractères) pour l'algorithme HS256.
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Génère un nouveau token JWT signé pour un utilisateur donné.
     * On y inclut l'email (comme "subject") et le rôle (comme claim personnalisé),
     * pour que les autres microservices puissent connaître le rôle de l'utilisateur
     * sans avoir besoin de rappeler auth-service à chaque requête.
     */
    public String generateToken(String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extrait l'email (subject) contenu dans le token.
     * Utilisé par JwtFilter pour savoir QUI fait la requête.
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrait le rôle contenu dans le token.
     * Utilisé par JwtFilter pour savoir quelles autorisations accorder.
     */
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    /**
     * Vérifie que le token est valide : signature correcte ET non expiré.
     * Si la signature a été falsifiée ou si le token est expiré,
     * parseSignedClaims() lève une exception -> on la capture et renvoie false
     * plutôt que de laisser planter toute la requête.
     */
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Méthode générique : extrait n'importe quel claim via une fonction "résolveur"
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Décode et vérifie la signature du token, puis retourne l'ensemble des claims
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}