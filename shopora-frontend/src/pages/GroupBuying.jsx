import { useEffect, useState } from 'react'
import { Clock, Users, Zap, X } from 'lucide-react'
import { getActiveSessions, joinSession } from '../api/groupBuyingApi'
import { getOfferById, getProductById } from '../api/catalogApi'
import { useAuthStore } from '../store/authStore'
import useGroupBuyingSocket from '../hooks/useGroupBuyingSocket'

function formatTimer(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Modale participants
function ParticipantsModal({ session, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-display text-xl font-bold text-ink">
                        Participants ({session.currentParticipants}/{session.targetParticipants})
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>
                <div className="px-6 py-5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-ink-light">Progression</span>
                        <span className="text-sm font-semibold text-clay">
              {Math.round((session.currentParticipants / session.targetParticipants) * 100)}%
            </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <div
                            className="h-full bg-gradient-to-r from-clay to-yellow-500 transition-all duration-500"
                            style={{
                                width: `${Math.min(
                                    (session.currentParticipants / session.targetParticipants) * 100,
                                    100
                                )}%`,
                            }}
                        />
                    </div>
                    <div className="space-y-3">
                        {Array.from({ length: session.currentParticipants }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-quartz-light flex items-center justify-center">
                                    <Users size={14} className="text-clay" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-ink">Participant {i + 1}</p>
                                    <p className="text-xs text-ink-light">A rejoint ce groupe</p>
                                </div>
                            </div>
                        ))}
                        {session.currentParticipants === 0 && (
                            <p className="text-sm text-ink-light text-center py-4">
                                Aucun participant pour le moment. Soyez le premier !
                            </p>
                        )}
                    </div>
                    <div className="mt-4 p-3 bg-quartz-light/30 rounded-xl">
                        <p className="text-xs text-ink-light text-center">
                            Encore <span className="font-bold text-clay">
                {session.targetParticipants - session.currentParticipants}
              </span> participant(s) nécessaires pour valider le groupe
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function GroupCard({ initialSession, onJoin, joiningId, role }) {
    const session = useGroupBuyingSocket(initialSession)
    const [remaining, setRemaining] = useState(session.remainingSeconds)
    const [showParticipants, setShowParticipants] = useState(false)

    useEffect(() => { setRemaining(session.remainingSeconds) }, [session.remainingSeconds])

    useEffect(() => {
        if (remaining <= 0 || session.status !== 'ACTIVE') return
        const interval = setInterval(() => setRemaining(prev => Math.max(prev - 1, 0)), 1000)
        return () => clearInterval(interval)
    }, [remaining, session.status])

    const progress = Math.min(
        (session.currentParticipants / session.targetParticipants) * 100,
        100
    )
    const isUrgent = remaining < 7200
    const discount = session.originalPrice
        ? Math.round((1 - session.groupPrice / session.originalPrice) * 100)
        : 20

    return (
        <>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-quartz-light/30">
                    {session.imageUrl ? (
                        <img
                            src={session.imageUrl}
                            alt={session.productName || 'Produit'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
              <span className="text-ink-light text-sm">
                {session.productName || `Produit #${session.productOfferId}`}
              </span>
                        </div>
                    )}

                    {/* Badge remise */}
                    <div className="absolute top-3 left-3 bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Zap size={11} /> -{discount}%
                    </div>

                    {/* Timer */}
                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                        isUrgent ? 'bg-clay text-white' : 'bg-white text-ink'
                    }`}>
                        <Clock size={12} />
                        {formatTimer(remaining)}
                    </div>
                </div>

                {/* Infos */}
                <div className="p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        {session.productName || `Offre #${session.productOfferId}`}
                    </p>
                    <p className="font-bold text-clay text-xl mb-3">{session.groupPrice} MAD</p>

                    {/* Barre progression + lien participants */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <button
                                onClick={() => setShowParticipants(true)}
                                className="flex items-center gap-1 text-ink-light hover:text-clay transition-colors"
                            >
                                <Users size={12} />
                                <span className="underline underline-offset-2">
                  {session.currentParticipants}/{session.targetParticipants} participants
                </span>
                            </button>
                            <span className="text-ink-light">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-clay to-yellow-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Bouton rejoindre */}
                    {role === 'CLIENT' && session.status === 'ACTIVE' && (
                        <button
                            onClick={() => onJoin(session.id)}
                            disabled={joiningId === session.id}
                            className="w-full py-2.5 rounded-xl bg-clay text-white text-sm font-semibold hover:bg-clay-dark transition-colors disabled:opacity-50"
                        >
                            {joiningId === session.id ? 'En cours...' : 'Rejoindre ce groupe'}
                        </button>
                    )}

                    {session.status !== 'ACTIVE' && (
                        <div className={`w-full py-2 rounded-xl text-sm font-semibold text-center ${
                            session.status === 'SUCCESSFUL'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-50 text-gray-500'
                        }`}>
                            {session.status === 'SUCCESSFUL' ? 'Session réussie ✓' : 'Session terminée'}
                        </div>
                    )}
                </div>
            </div>

            {showParticipants && (
                <ParticipantsModal
                    session={session}
                    onClose={() => setShowParticipants(false)}
                />
            )}
        </>
    )
}

export default function GroupBuying() {
    const { role } = useAuthStore()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [joiningId, setJoiningId] = useState(null)
    const [feedback, setFeedback] = useState(null)

    useEffect(() => { loadSessions() }, [])

    const loadSessions = async () => {
        setLoading(true)
        try {
            const rawSessions = await getActiveSessions()

            // Enrichit chaque session avec le nom et l'image du produit
            const enriched = await Promise.all(
                rawSessions.map(async (session) => {
                    try {
                        const offer = await getOfferById(session.productOfferId)
                        const product = await getProductById(offer.productId)
                        return {
                            ...session,
                            productName: offer.productName || product.name,
                            imageUrl: product.imageUrl,
                            originalPrice: offer.price,
                        }
                    } catch {
                        return { ...session, productName: null, imageUrl: null }
                    }
                })
            )

            setSessions(enriched)
        } catch {
            setSessions([])
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async (sessionId) => {
        setJoiningId(sessionId)
        setFeedback(null)
        try {
            await joinSession(sessionId)
            setFeedback({ type: 'success', message: 'Vous avez rejoint le groupe avec succès !' })
            loadSessions()
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error.response?.data?.message || 'Impossible de rejoindre.',
            })
        } finally {
            setJoiningId(null)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-ink">Achats groupés en cours</h1>
                <p className="text-ink-light mt-1">
                    Rejoignez un groupe avant la fin du timer pour bénéficier du prix réduit.
                </p>
            </div>

            {feedback && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                    feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}>
                    {feedback.message}
                </div>
            )}

            {loading && (
                <p className="text-center text-ink-light py-20">Chargement...</p>
            )}

            {!loading && sessions.length === 0 && (
                <p className="text-center text-ink-light py-20">
                    Aucune session active pour le moment.
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <GroupCard
                        key={session.id}
                        initialSession={session}
                        onJoin={handleJoin}
                        joiningId={joiningId}
                        role={role}
                    />
                ))}
            </div>
        </div>
    )
}