import { useEffect, useState } from 'react'
import useGroupBuyingSocket from '../../hooks/useGroupBuyingSocket'
import TicketBadge from './TicketBadge'
import Button from './Button'

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

function statusLabel(status) {
    if (status === 'SUCCESSFUL') return 'Réussie'
    if (status === 'FAILED') return 'Échouée'
    return status
}

function SessionCard({ initialSession, onJoin, joiningId, currentUserRole }) {
    const session = useGroupBuyingSocket(initialSession)
    const [remaining, setRemaining] = useState(session.remainingSeconds)

    // Resynchronise le compte à rebours CHAQUE FOIS qu'un message WebSocket
    // arrive (nouveau participant, résolution...) -> le timer reste fidèle
    // à la vérité du serveur, même si l'horloge du navigateur a dérivé.
    useEffect(() => {
        setRemaining(session.remainingSeconds)
    }, [session.remainingSeconds])

    // Décrémente le timer affiché chaque seconde, localement, pour un défilement
    // fluide -> sans ça, l'affichage ne bougerait que par sauts, au rythme
    // des messages WebSocket (qui n'arrivent qu'à chaque changement réel).
    useEffect(() => {
        if (remaining <= 0 || session.status !== 'ACTIVE') return
        const interval = setInterval(() => setRemaining((prev) => Math.max(prev - 1, 0)), 1000)
        return () => clearInterval(interval)
    }, [remaining, session.status])

    const progress = Math.min((session.currentParticipants / session.targetParticipants) * 100, 100)

    return (
        <div className="bg-linen border border-sand rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <TicketBadge label="Prix groupé" value={`${session.groupPrice} MAD`} accent />
                <TicketBadge
                    label={session.status === 'ACTIVE' ? 'Temps restant' : 'Statut'}
                    value={session.status === 'ACTIVE' ? formatTime(remaining) : statusLabel(session.status)}
                />
            </div>

            <div className="mb-2 flex justify-between text-sm text-ink-light">
                <span>{session.currentParticipants} / {session.targetParticipants} participants</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
                <div className="h-full bg-moss transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            {currentUserRole === 'CLIENT' && session.status === 'ACTIVE' && (
                <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => onJoin(session.id)}
                    loading={joiningId === session.id}
                >
                    Rejoindre ce groupe
                </Button>
            )}
        </div>
    )
}

export default SessionCard