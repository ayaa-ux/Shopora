import { useEffect, useState } from 'react'
import { subscribeToTopic } from '../lib/stompClient'

/**
 * Retourne la dernière version connue d'une session (REST + mises à jour WebSocket).
 * Les messages WebSocket sont FUSIONNÉS avec l'état existant : avant, ils remplaçaient
 * tout l'objet et faisaient disparaître productName, imageUrl et originalPrice.
 */
function useGroupBuyingSocket(initialSession) {
    const [session, setSession] = useState(initialSession)

    // Nouvelle donnée REST (ex: rechargement de la liste) -> on fusionne
    useEffect(() => {
        setSession((prev) => ({ ...prev, ...initialSession }))
    }, [initialSession])

    useEffect(() => {
        if (!initialSession?.id) return

        const unsubscribe = subscribeToTopic(`/topic/sessions/${initialSession.id}`, (message) => {
            try {
                setSession((prev) => ({ ...prev, ...JSON.parse(message.body) }))
            } catch {
                // message illisible : on l'ignore
            }
        })

        return unsubscribe
    }, [initialSession?.id])

    return session
}

export default useGroupBuyingSocket