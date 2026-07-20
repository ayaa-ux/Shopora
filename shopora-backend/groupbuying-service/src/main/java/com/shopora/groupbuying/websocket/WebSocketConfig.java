package com.shopora.groupbuying.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration STOMP par-dessus WebSocket.
 *
 * Schéma de communication :
 * - Le frontend SE CONNECTE une seule fois à /ws-groupbuying.
 * - Il S'ABONNE ensuite à /topic/sessions/{sessionId} pour une session précise.
 * - Le BACKEND envoie des messages sur ce topic chaque fois que le compteur
 *   change ou que la session est résolue (voir GroupBuySessionService modifié
 *   plus bas) -> TOUS les clients abonnés reçoivent la mise à jour instantanément,
 *   sans avoir besoin de faire un appel REST de "polling" répété.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // "/topic" : préfixe des canaux de diffusion (broadcast) vers les clients.
        // enableSimpleBroker = broker mémoire intégré, suffisant pour ce projet
        // (pas besoin de RabbitMQ/ActiveMQ externe pour un Bachelor).
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-groupbuying")
                .addInterceptors(jwtHandshakeInterceptor)
                .setAllowedOriginPatterns("http://localhost:5173")
                // SockJS : fallback automatique si le navigateur/réseau bloque
                // les WebSockets natifs (proxies d'entreprise stricts, etc.)
                .withSockJS();
    }
}