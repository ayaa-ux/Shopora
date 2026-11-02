import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'

let client = null
let connected = false
let currentToken = null

// Registre de TOUS les abonnements souhaités. À chaque (re)connexion on les
// ré-abonne : plus de perte d'abonnements après une coupure réseau.
const subscriptions = new Map()
let nextId = 0

function disconnect() {
    if (client) client.deactivate()
    client = null
    connected = false
    currentToken = null
}

function ensureClient() {
    const token = useAuthStore.getState().token
    // Visiteur non connecté : pas de WebSocket (le handshake serait refusé en boucle)
    if (!token) return null
    if (client && currentToken === token) return client

    disconnect()
    currentToken = token

    client = new Client({
        webSocketFactory: () =>
            new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws-groupbuying?token=${encodeURIComponent(token)}`),
        reconnectDelay: 5000,
    })

    client.onConnect = () => {
        connected = true
        subscriptions.forEach((entry) => {
            entry.stompSub = client.subscribe(entry.topic, entry.callback)
        })
    }

    client.onWebSocketClose = () => {
        connected = false
        subscriptions.forEach((entry) => { entry.stompSub = null })
    }

    client.activate()
    return client
}

/**
 * S'abonne à un topic. Retourne une fonction de désabonnement (appel synchrone).
 */
export function subscribeToTopic(topic, callback) {
    const id = nextId++
    const entry = { topic, callback, stompSub: null }
    subscriptions.set(id, entry)

    const stompClient = ensureClient()
    if (stompClient && connected) {
        entry.stompSub = stompClient.subscribe(topic, callback)
    }

    return () => {
        entry.stompSub?.unsubscribe()
        subscriptions.delete(id)
    }
}

// Déconnexion -> on coupe le socket ; connexion -> on (re)connecte si des abonnements attendent.
useAuthStore.subscribe((state) => {
    if (!state.token) {
        disconnect()
    } else if (subscriptions.size > 0) {
        ensureClient()
    }
})