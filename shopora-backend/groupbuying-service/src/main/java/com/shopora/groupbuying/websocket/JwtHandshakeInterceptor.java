package com.shopora.groupbuying.websocket;

import com.shopora.groupbuying.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Sécurise la connexion WebSocket (WSS) AVANT qu'elle ne soit établie.
 *
 * Pourquoi un mécanisme séparé de JwtFilter ? Les navigateurs n'autorisent pas
 * d'ajouter un header "Authorization" personnalisé lors d'un handshake WebSocket
 * natif. La convention standard est donc de passer le token en paramètre
 * de requête (?token=...) dans l'URL de connexion, lu ici une seule fois,
 * au moment de la poignée de main initiale.
 */
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtils jwtUtils;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {

        String token = extractTokenFromQuery(request.getURI().getQuery());

        if (token == null || !jwtUtils.isTokenValid(token)) {
            // Refuse explicitement la connexion : le client recevra une erreur
            // au moment du new SockJS(...) côté React, plutôt qu'une connexion
            // "fantôme" jamais authentifiée.
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        // Stocke l'email dans les attributs de session WebSocket : potentiellement
        // utile plus tard si on veut envoyer des messages ciblés à un client précis
        // (et non uniquement des diffusions publiques sur /topic/...).
        attributes.put("email", jwtUtils.extractEmail(token));
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // Rien à faire après le handshake ici.
    }

    private String extractTokenFromQuery(String query) {
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] pair = param.split("=");
            if (pair.length == 2 && pair[0].equals("token")) {
                return pair[1];
            }
        }
        return null;
    }
}