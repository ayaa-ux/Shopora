import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyOffers } from '../api/catalogApi'
import { createSession } from '../api/groupBuyingApi'
import { ArrowLeft, Users, Clock, Tag } from 'lucide-react'

export default function CreateSession() {
    const navigate = useNavigate()
    const [myOffers, setMyOffers] = useState([])
    const [loadingOffers, setLoadingOffers] = useState(true)
    const [form, setForm] = useState({
        productOfferId: '',
        targetParticipants: '',
        groupPrice: '',
        durationHours: '',
    })
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => { loadMyOffers() }, [])

    const loadMyOffers = async () => {
        setLoadingOffers(true)
        try { setMyOffers(await getMyOffers()) }
        finally { setLoadingOffers(false) }
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFieldErrors({})
        setSuccessMessage('')
        setSubmitting(true)
        try {
            await createSession({
                productOfferId: Number(form.productOfferId),
                targetParticipants: Number(form.targetParticipants),
                groupPrice: Number(form.groupPrice),
                durationHours: Number(form.durationHours),
            })
            setSuccessMessage('Session créée avec succès !')
            setTimeout(() => navigate('/group-buying'), 1200)
        } catch (error) {
            const data = error.response?.data
            if (data?.fieldErrors) setFieldErrors(data.fieldErrors)
            else setFieldErrors({ general: data?.message || 'Une erreur est survenue.' })
        } finally {
            setSubmitting(false)
        }
    }

    if (loadingOffers) return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-ink-light">
            Chargement...
        </div>
    )

    if (myOffers.length === 0) return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <p className="text-ink-light mb-4">
                Publiez d'abord une offre dans le catalogue avant de lancer une session.
            </p>
            <button
                onClick={() => navigate('/catalogue')}
                className="text-clay font-medium text-sm"
            >
                Aller au catalogue →
            </button>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <button
                onClick={() => navigate('/group-buying')}
                className="flex items-center gap-2 text-sm text-ink-light hover:text-ink mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Retour aux groupes
            </button>

            <h1 className="font-display text-3xl font-bold text-ink mb-1">
                Lancer un achat groupé
            </h1>
            <p className="text-ink-light text-sm mb-8">
                Choisissez une offre, fixez un objectif de participants et une durée.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Offre */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <label className="block text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                        <Tag size={16} className="text-clay" /> Offre concernée
                    </label>
                    <select
                        name="productOfferId"
                        value={form.productOfferId}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay bg-white"
                    >
                        <option value="">Sélectionnez une de vos offres</option>
                        {myOffers.map((offer) => (
                            <option key={offer.id} value={offer.id}>
                                {offer.productName} — {offer.price} MAD
                            </option>
                        ))}
                    </select>
                </div>

                {/* Participants et prix */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <label className="block text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                        <Users size={16} className="text-clay" /> Objectif et prix groupé
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-ink-light mb-1">Nombre de participants visé</label>
                            <input
                                type="number" name="targetParticipants" value={form.targetParticipants}
                                onChange={handleChange} placeholder="20"
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
                                    fieldErrors.targetParticipants ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />
                            {fieldErrors.targetParticipants && (
                                <p className="text-xs text-red-500 mt-1">{fieldErrors.targetParticipants}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-ink-light mb-1">Prix groupé (MAD)</label>
                            <input
                                type="number" name="groupPrice" value={form.groupPrice}
                                onChange={handleChange} placeholder="199"
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
                                    fieldErrors.groupPrice ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />
                            {fieldErrors.groupPrice && (
                                <p className="text-xs text-red-500 mt-1">{fieldErrors.groupPrice}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Durée */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <label className="block text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-clay" /> Durée de la session
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[6, 12, 24, 48, 72, 168].map((h) => (
                            <button
                                key={h} type="button"
                                onClick={() => setForm({ ...form, durationHours: String(h) })}
                                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                                    form.durationHours === String(h)
                                        ? 'bg-clay text-white border-clay'
                                        : 'bg-white text-ink border-gray-200 hover:border-clay'
                                }`}
                            >
                                {h < 24 ? `${h}h` : `${h / 24}j`}
                            </button>
                        ))}
                    </div>
                    {fieldErrors.durationHours && (
                        <p className="text-xs text-red-500 mt-2">{fieldErrors.durationHours}</p>
                    )}
                </div>

                {fieldErrors.general && (
                    <p className="text-sm text-red-500">{fieldErrors.general}</p>
                )}
                {successMessage && (
                    <p className="text-sm text-moss font-medium">{successMessage}</p>
                )}

                <button
                    type="submit" disabled={submitting}
                    className="w-full py-3.5 bg-clay text-white font-bold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Création en cours...' : 'Lancer la session'}
                </button>
            </form>
        </div>
    )
}