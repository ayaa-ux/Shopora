import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Truck, CheckCircle } from 'lucide-react'
import { useCartStore } from '../store/cartStore'

const PAYMENT_METHODS = [
    { id: 'card', label: 'Carte bancaire', icon: CreditCard },
    { id: 'delivery', label: 'Paiement à la livraison', icon: Truck },
]

export default function Checkout() {
    const navigate = useNavigate()
    const { items, totalPrice, clearCart } = useCartStore()
    const [paymentMethod, setPaymentMethod] = useState('delivery')
    const [confirmed, setConfirmed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
    })
    const [cardForm, setCardForm] = useState({
        number: '',
        expiry: '',
        cvv: '',
        holder: '',
    })
    const [errors, setErrors] = useState({})

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const handleCardChange = (e) =>
        setCardForm({ ...cardForm, [e.target.name]: e.target.value })

    const validate = () => {
        const newErrors = {}
        if (!form.firstName) newErrors.firstName = 'Obligatoire'
        if (!form.lastName) newErrors.lastName = 'Obligatoire'
        if (!form.address) newErrors.address = 'Obligatoire'
        if (!form.city) newErrors.city = 'Obligatoire'
        if (!form.phone) newErrors.phone = 'Obligatoire'
        if (paymentMethod === 'card') {
            if (!cardForm.number) newErrors.number = 'Obligatoire'
            if (!cardForm.expiry) newErrors.expiry = 'Obligatoire'
            if (!cardForm.cvv) newErrors.cvv = 'Obligatoire'
            if (!cardForm.holder) newErrors.holder = 'Obligatoire'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        // Simulation d'un délai de traitement (500ms)
        await new Promise(res => setTimeout(res, 800))
        clearCart()
        setConfirmed(true)
        setLoading(false)
    }

    // Écran de confirmation après commande
    if (confirmed) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h1 className="font-display text-2xl font-bold text-ink mb-2">
                    Commande confirmée !
                </h1>
                <p className="text-ink-light mb-8">
                    Merci pour votre achat. Vous recevrez une confirmation par email.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-clay text-white font-semibold px-8 py-3 rounded-xl hover:bg-clay-dark transition-colors"
                >
                    Retour à l'accueil
                </button>
            </div>
        )
    }

    // Redirection si panier vide
    if (items.length === 0) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <p className="text-ink-light mb-4">Votre panier est vide.</p>
                <button
                    onClick={() => navigate('/catalogue')}
                    className="text-clay font-medium"
                >
                    Découvrir le catalogue →
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-8">Commande</h1>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Colonne gauche : formulaires */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Adresse de livraison */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-semibold text-ink text-lg mb-5">
                                Adresse de livraison
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input
                                        name="firstName" value={form.firstName} onChange={handleChange}
                                        placeholder="Prénom"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.firstName ? 'border-red-300' : 'border-gray-200'}`}
                                    />
                                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <input
                                        name="lastName" value={form.lastName} onChange={handleChange}
                                        placeholder="Nom"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.lastName ? 'border-red-300' : 'border-gray-200'}`}
                                    />
                                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                                </div>
                                <div className="col-span-2">
                                    <input
                                        name="address" value={form.address} onChange={handleChange}
                                        placeholder="Adresse"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.address ? 'border-red-300' : 'border-gray-200'}`}
                                    />
                                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                                </div>
                                <div>
                                    <input
                                        name="city" value={form.city} onChange={handleChange}
                                        placeholder="Ville"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.city ? 'border-red-300' : 'border-gray-200'}`}
                                    />
                                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                                </div>
                                <div>
                                    <input
                                        name="postalCode" value={form.postalCode} onChange={handleChange}
                                        placeholder="Code postal"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        name="phone" value={form.phone} onChange={handleChange}
                                        placeholder="Téléphone (+212...)"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Mode de paiement */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-semibold text-ink text-lg mb-5">Mode de paiement</h2>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setPaymentMethod(id)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                                            paymentMethod === id
                                                ? 'border-clay bg-quartz-light/30'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon size={20} className={paymentMethod === id ? 'text-clay' : 'text-ink-light'} />
                                        <span className={`text-sm font-medium ${paymentMethod === id ? 'text-clay' : 'text-ink'}`}>
                      {label}
                    </span>
                                    </button>
                                ))}
                            </div>

                            {/* Formulaire carte */}
                            {paymentMethod === 'card' && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-ink-light mb-3">
                                        🔒 Vos informations bancaires sont sécurisées (simulation démo).
                                    </p>
                                    <input
                                        name="holder" value={cardForm.holder} onChange={handleCardChange}
                                        placeholder="Nom sur la carte"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.holder ? 'border-red-300' : 'border-gray-200'}`}
                                    />
                                    {errors.holder && <p className="text-xs text-red-500 mt-1">{errors.holder}</p>}

                                    <input
                                        name="number" value={cardForm.number} onChange={handleCardChange}
                                        placeholder="Numéro de carte (1234 5678 9012 3456)"
                                        maxLength={19}
                                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay font-mono ${errors.number ? 'border-red-300' : 'border-gray-200'}`}
                                    />
                                    {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number}</p>}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <input
                                                name="expiry" value={cardForm.expiry} onChange={handleCardChange}
                                                placeholder="MM/AA"
                                                maxLength={5}
                                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay font-mono ${errors.expiry ? 'border-red-300' : 'border-gray-200'}`}
                                            />
                                            {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                                        </div>
                                        <div>
                                            <input
                                                name="cvv" value={cardForm.cvv} onChange={handleCardChange}
                                                placeholder="CVV"
                                                maxLength={3}
                                                type="password"
                                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay font-mono ${errors.cvv ? 'border-red-300' : 'border-gray-200'}`}
                                            />
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

                    {/* Colonne droite : récapitulatif */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
                            <h2 className="font-semibold text-ink text-lg mb-5">Récapitulatif</h2>

                            <div className="space-y-3 mb-5">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-ink-light truncate flex-1 mr-2">
                      {item.name} × {item.quantity}
                    </span>
                                        <span className="font-medium text-ink shrink-0">
                      {(item.price * item.quantity).toFixed(2)} MAD
                    </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink-light">Sous-total</span>
                                    <span className="text-ink">{totalPrice().toFixed(2)} MAD</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-ink-light">Livraison</span>
                                    <span className="text-green-500 font-medium">Gratuite</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 mt-2">
                                    <span className="text-ink">Total</span>
                                    <span className="text-ink">{totalPrice().toFixed(2)} MAD</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                onClick={handleSubmit}
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