import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Truck, CheckCircle } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { createOrder, apiErrorMessage } from '../api/orderApi'

const PAYMENT_METHODS = [
    { id: 'card', label: 'Carte bancaire', icon: CreditCard },
    { id: 'delivery', label: 'Paiement à la livraison', icon: Truck },
]

const ADDRESS_FIELDS = [
    { name: 'firstName', placeholder: 'Prénom', required: true },
    { name: 'lastName', placeholder: 'Nom', required: true },
    { name: 'address', placeholder: 'Adresse', required: true, full: true },
    { name: 'city', placeholder: 'Ville', required: true },
    { name: 'postalCode', placeholder: 'Code postal' },
    { name: 'phone', placeholder: 'Téléphone (+212...)', required: true, full: true },
]

const inputCls = (error, extra = '') =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${extra} ${
        error ? 'border-red-300' : 'border-gray-200'
    }`

function isExpiryValid(value) {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)
    if (!match) return false
    // La carte est valable jusqu'à la fin du mois d'expiration
    return new Date(2000 + Number(match[2]), Number(match[1]), 1) > new Date()
}

export default function Checkout() {
    const navigate = useNavigate()
    const { items, clearCart } = useCartStore()

    const [paymentMethod, setPaymentMethod] = useState('delivery')
    const [confirmedOrder, setConfirmedOrder] = useState(null)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ firstName: '', lastName: '', address: '', city: '', postalCode: '', phone: '' })
    const [cardForm, setCardForm] = useState({ holder: '', number: '', expiry: '', cvv: '' })
    const [errors, setErrors] = useState({})
    const [submitError, setSubmitError] = useState('')

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleCardChange = (e) => {
        const { name } = e.target
        let value = e.target.value
        if (name === 'number') {
            value = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
        } else if (name === 'expiry') {
            const digits = value.replace(/\D/g, '').slice(0, 4)
            value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
        } else if (name === 'cvv') {
            value = value.replace(/\D/g, '').slice(0, 3)
        }
        setCardForm({ ...cardForm, [name]: value })
    }

    const validate = () => {
        const e = {}
        ADDRESS_FIELDS.forEach(({ name, required }) => {
            if (required && !form[name].trim()) e[name] = 'Obligatoire'
        })
        if (form.phone && !/^(\+212|0)[5-7]\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
            e.phone = 'Numéro marocain invalide (ex: +212 6XX XXX XXX)'
        }
        if (paymentMethod === 'card') {
            if (!cardForm.holder.trim()) e.holder = 'Obligatoire'
            if (cardForm.number.replace(/\s/g, '').length !== 16) e.number = 'Numéro à 16 chiffres requis'
            if (!isExpiryValid(cardForm.expiry)) e.expiry = 'Date invalide ou expirée'
            if (cardForm.cvv.length !== 3) e.cvv = '3 chiffres'
        }
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate() || loading) return
        setLoading(true)
        setSubmitError('')
        try {
            // On n'envoie ni prix ni vendeur : le serveur les relit dans le catalogue.
            // Aucune donnée de carte n'est transmise (paiement simulé).
            const order = await createOrder({
                items: items.map(({ id, quantity }) => ({ offerId: id, quantity })),
                paymentMethod: paymentMethod === 'card' ? 'CARD' : 'DELIVERY',
                firstName: form.firstName,
                lastName: form.lastName,
                address: form.address,
                city: form.city,
                postalCode: form.postalCode,
                phone: form.phone.replace(/\s/g, ''),
            })
            clearCart()
            setConfirmedOrder(order)
        } catch (err) {
            setSubmitError(apiErrorMessage(err, 'Impossible de passer la commande.'))
        } finally {
            setLoading(false)
        }
    }

    if (confirmedOrder) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h1 className="font-display text-2xl font-bold text-ink mb-2">Commande confirmée !</h1>
                <p className="text-ink-light mb-1">Numéro de commande : <b>{confirmedOrder.orderNumber}</b></p>
                <p className="text-ink-light mb-8">Merci pour votre achat.</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => navigate('/orders')}
                        className="bg-clay text-white font-semibold px-6 py-3 rounded-xl hover:bg-clay-dark transition-colors"
                    >
                        Mes commandes
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="border border-gray-200 text-ink font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Accueil
                    </button>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <p className="text-ink-light mb-4">Votre panier est vide.</p>
                <Link to="/catalogue" className="text-clay font-medium">Découvrir le catalogue →</Link>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-8">Commande</h1>

            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-semibold text-ink text-lg mb-5">Adresse de livraison</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {ADDRESS_FIELDS.map(({ name, placeholder, full }) => (
                                    <div key={name} className={full ? 'col-span-2' : ''}>
                                        <input
                                            name={name}
                                            value={form[name]}
                                            onChange={handleChange}
                                            placeholder={placeholder}
                                            className={inputCls(errors[name])}
                                        />
                                        {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-semibold text-ink text-lg mb-5">Mode de paiement</h2>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setPaymentMethod(id)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                                            paymentMethod === id ? 'border-clay bg-quartz-light/30' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon size={20} className={paymentMethod === id ? 'text-clay' : 'text-ink-light'} />
                                        <span className={`text-sm font-medium ${paymentMethod === id ? 'text-clay' : 'text-ink'}`}>
                                            {label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {paymentMethod === 'card' && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-ink-light">🔒 Simulation de démonstration : aucune donnée de carte n'est conservée.</p>
                                    <div>
                                        <input name="holder" value={cardForm.holder} onChange={handleCardChange}
                                               placeholder="Nom sur la carte" className={inputCls(errors.holder)} />
                                        {errors.holder && <p className="text-xs text-red-500 mt-1">{errors.holder}</p>}
                                    </div>
                                    <div>
                                        <input name="number" value={cardForm.number} onChange={handleCardChange}
                                               placeholder="1234 5678 9012 3456" inputMode="numeric"
                                               className={inputCls(errors.number, 'font-mono')} />
                                        {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <input name="expiry" value={cardForm.expiry} onChange={handleCardChange}
                                                   placeholder="MM/AA" inputMode="numeric"
                                                   className={inputCls(errors.expiry, 'font-mono')} />
                                            {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                                        </div>
                                        <div>
                                            <input name="cvv" value={cardForm.cvv} onChange={handleCardChange}
                                                   placeholder="CVV" type="password" inputMode="numeric"
                                                   className={inputCls(errors.cvv, 'font-mono')} />
                                            {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'delivery' && (
                                <div className="bg-gray-50 rounded-xl p-4 mt-2">
                                    <p className="text-sm text-ink-light flex items-center gap-2">
                                        <Truck size={16} className="text-clay shrink-0" />
                                        Vous payez en espèces à la réception de votre commande.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
                            <h2 className="font-semibold text-ink text-lg mb-5">Récapitulatif</h2>

                            <div className="space-y-3 mb-5">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <span className="text-ink-light truncate flex-1 mr-2">{item.name} × {item.quantity}</span>
                                        <span className="font-medium text-ink shrink-0">
                                            {(item.price * item.quantity).toFixed(2)} MAD
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink-light">Sous-total</span>
                                    <span className="text-ink">{total.toFixed(2)} MAD</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink-light">Livraison</span>
                                    <span className="text-green-500 font-medium">Gratuite</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 mt-2">
                                    <span className="text-ink">Total</span>
                                    <span className="text-ink">{total.toFixed(2)} MAD</span>
                                </div>
                            </div>

                            {submitError && (
                                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                                    {submitError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-6 py-3.5 bg-clay text-white font-bold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Traitement...' : 'Confirmer la commande'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}