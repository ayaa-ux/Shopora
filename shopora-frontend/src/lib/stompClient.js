import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'

let client = null
let isConnected = false

// File d'attente des abonnements demandés AVANT que la connexion STOMP
// ne soit réellement établie. Nécessaire car GroupBuying.jsx va afficher
// plusieurs cartes de session en même temps, qui vont toutes essayer de
// s'abonner quasi simultanément, souvent avant la fin du handshake.
const pendingSubscriptions = []

function initClient() {
    if (client) return client

    const token = useAuthStore.getState().token

    client = new Client({
        // SockJS gère lui-même la négociation du transport -> on lui donne
        // une URL http(s), jamais ws(s):// directement.
        webSocketFactory: () =>
            new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws-groupbuying?token=${token}`),
        reconnectDelay: 5000, // tente de se reconnecter automatiquement si la connexion tombe
    })

    client.onConnect = () => {
        isConnected = true
        // Traite TOUTES les demandes d'abonnement en attente d'un coup,
        // plutôt que de risquer d'en perdre si plusieurs arrivent avant
        // que la connexion ne soit prête (cas garanti sur cette page).
        pendingSubscriptions.forEach(({ topic, callback, resolve }) => {
            resolve(client.subscribe(topic, callback))
        })
        pendingSubscriptions.length = 0
    }

    client.activate()
    return client
}

/**
 * S'abonne à un topic STOMP, peu importe si la connexion est déjà prête
 * ou pas encore. Retourne une Promise résolue avec l'objet "subscription"
 * (utile pour se désabonner proprement au démontage d'un composant).
 *
 * LIMITE CONNUE (à mentionner en soutenance si besoin) : si la connexion
 * est coupée puis rétablie (reconnectDelay), les abonnements existants
 * ne sont pas automatiquement restaurés. Pour ce projet, un simple
 * rechargement de page suffit à corriger ce cas rare.
 */
export function subscribeToTopic(topic, callback) {
    const stompClient = initClient()

    return new Promise((resolve) => {
        if (isConnected) {
            resolve(stompClient.subscribe(topic, callback))
        } else {
            pendingSubscriptions.push({ topic, callback, resolve })
        }
    })
}