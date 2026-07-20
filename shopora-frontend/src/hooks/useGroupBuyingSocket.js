import { useEffect, useState } from 'react'
import { subscribeToTopic } from '../lib/stompClient'

/**
 * Abonne un composant aux mises à jour temps réel d'UNE session de Group Buying.
 * Retourne toujours la dernière version connue de la session (currentParticipants,
 * status...), sans qu'aucun appel REST de "polling" ne soit nécessaire.
 *
 * @param {object} initialSession - état de départ, chargé via REST au montage de la page
 */
function useGroupBuyingSocket(initialSession) {
    const [session, setSession] = useState(initialSession)

    useEffect(() => {
        if (!initialSession?.id) return

        let subscription
        subscribeToTopic(`/topic/sessions/${initialSession.id}`, (message) => {
            setSession(JSON.parse(message.body))
        }).then((sub) => {
            subscription = sub
        })

        // Se désabonne quand le composant est démonté, pour ne pas accumuler
        // des abonnements fantômes en mémoire (ex: l'utilisateur quitte la page).
        return () => {
            subscription?.unsubscribe()
        }
    }, [initialSession?.id])

    return session
}

export default useGroupBuyingSocket