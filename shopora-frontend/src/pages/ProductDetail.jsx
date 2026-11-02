import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Shield, Truck } from 'lucide-react'
import { getProductById, getOffersByProduct, createOffer } from '../api/catalogApi'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role, email } = useAuthStore()
    const addItem = useCartStore((state) => state.addItem)

    const [product, setProduct] = useState(null)
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    const [offerForm, setOfferForm] = useState({ price: '', stockQuantity: '' })
    const [fieldErrors, setFieldErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [offerSuccess, setOfferSuccess] = useState('')

    const [addedFeedback, setAddedFeedback] = useState(false)

    useEffect(() => { loadData() }, [id])

    const loadData = async () => {
        setLoading(true)
        try {
            const [productData, offersData] = await Promise.all([
                getProductById(id),
                getOffersByProduct(id),
            ])
            setProduct(productData)
            setOffers(offersData)
        } catch {
            setErrorMessage('Impossible de charger ce produit.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = () => {
        if (!bestOffer) return
        addItem({
            id: bestOffer.id,
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            price: bestOffer.price,
            vendorEmail: bestOffer.vendorEmail,
        })
        setAddedFeedback(true)
        setTimeout(() => setAddedFeedback(false), 2000)
    }

    const handleOfferSubmit = async (e) => {
        e.preventDefault()
        setFieldErrors({})
        setOfferSuccess('')
        setSubmitting(true)
        try {
            await createOffer({
                productId: Number(id),
                price: Number(offerForm.price),
                stockQuantity: Number(offerForm.stockQuantity),
            })
            setOfferForm({ price: '', stockQuantity: '' })
            setOfferSuccess('Votre offre a été publiée avec succès !')
            loadData()
        } catch (error) {
            const data = error.response?.data
            if (data?.fieldErrors) setFieldErrors(data.fieldErrors)
            else setFieldErrors({ general: data?.message || 'Une erreur est survenue.' })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-ink-light">
            Chargement...
        </div>
    )

    if (errorMessage) return (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-red-500">
            {errorMessage}
        </div>
    )

    if (!product) return null

    const bestOffer = offers[0]

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Retour */}
            <button
                onClick={() => navigate('/catalogue')}
                className="flex items-center gap-2 text-sm text-ink-light hover:text-ink mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Catalogue
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Image */}
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                            Pas d'image
                        </div>
                    )}
                </div>

                {/* Infos */}
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
                        {product.category}
                    </p>
                    <h1 className="font-display text-3xl font-bold text-ink mb-3">
                        {product.name}
                    </h1>

                    {product.description && (
                        <p className="text-ink-light text-sm leading-relaxed mb-6">
                            {product.description}
                        </p>
                    )}

                    {bestOffer && (
                        <div className="mb-6">
              <span className="font-bold text-3xl text-ink">
                {bestOffer.price} MAD
              </span>
                            <p className="text-xs text-gray-400 mt-1">Meilleur prix disponible</p>
                        </div>
                    )}

                    {!bestOffer && (
                        <p className="text-ink-light text-sm mb-6 italic">
                            Aucun vendeur ne propose encore ce produit.
                        </p>
                    )}

                    <button
                        onClick={handleAddToCart}
                        disabled={!bestOffer}
                        className={`w-full py-3.5 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mb-4 ${
                            addedFeedback
                                ? 'bg-moss text-white'
                                : 'bg-clay text-white hover:bg-clay-dark'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <ShoppingBag size={18} />
                        {addedFeedback ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
                    </button>

                    <div className="flex items-center gap-6 text-xs text-ink-light">
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-green-500" /> Paiement sécurisé
            </span>
                        <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-blue-400" /> Livraison gratuite
            </span>
                    </div>
                </div>
            </div>

            {/* Comparateur de prix */}
            <div className="mt-12">
                <h2 className="font-display text-2xl font-bold text-ink mb-2">
                    Comparateur de prix
                </h2>
                <p className="text-ink-light text-sm mb-6">
                    Le même produit, plusieurs vendeurs.
                </p>

                {offers.length === 0 ? (
                    <p className="text-ink-light text-sm italic">
                        Aucun vendeur ne propose encore ce produit.
                    </p>
                ) : (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
                            <span>Vendeur</span>
                            <span className="text-center">Stock</span>
                            <span className="text-right">Prix</span>
                        </div>
                        {offers.map((offer, index) => (
                            <div
                                key={offer.id}
                                className={`grid grid-cols-3 items-center px-6 py-4 ${
                                    index < offers.length - 1 ? 'border-b border-gray-100' : ''
                                } ${index === 0 ? 'bg-quartz-light/30' : 'bg-white'}`}
                            >
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-ink truncate">{offer.vendorEmail}</span>
                                    {index === 0 && (
                                        <span className="text-[10px] bg-clay text-white px-2 py-0.5 rounded-full font-medium">
                      MEILLEUR PRIX
                    </span>
                                    )}
                                    {offer.vendorEmail === email && (
                                        <span className="text-[10px] text-moss font-medium">(Vous)</span>
                                    )}
                                </div>
                                <span className="text-center text-sm text-ink-light">
                  {offer.stockQuantity} en stock
                </span>
                                <span className="text-right font-bold text-ink">
                  {offer.price} MAD
                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulaire VENDOR */}
            {role === 'VENDOR' && (
                <div className="mt-10 border-t border-gray-100 pt-8">
                    <h2 className="font-display text-xl font-bold text-ink mb-4">
                        Proposer mon prix
                    </h2>
                    <form onSubmit={handleOfferSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink mb-1">
                                Prix (MAD)
                            </label>
                            <input
                                type="number"
                                value={offerForm.price}
                                onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                                placeholder="299"
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
                                    fieldErrors.price ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />
                            {fieldErrors.price && (
                                <p className="text-xs text-red-500 mt-1">{fieldErrors.price}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink mb-1">
                                Quantité en stock
                            </label>
                            <input
                                type="number"
                                value={offerForm.stockQuantity}
                                onChange={(e) => setOfferForm({ ...offerForm, stockQuantity: e.target.value })}
                                placeholder="10"
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
                                    fieldErrors.stockQuantity ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />
                            {fieldErrors.stockQuantity && (
                                <p className="text-xs text-red-500 mt-1">{fieldErrors.stockQuantity}</p>
                            )}
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-clay text-white font-semibold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Publication...' : 'Publier mon offre'}
                            </button>
                        </div>
                    </form>
                    {fieldErrors.general && (
                        <p className="text-sm text-red-500 mt-2">{fieldErrors.general}</p>
                    )}
                    {offerSuccess && (
                        <p className="text-sm text-moss font-medium mt-2">{offerSuccess}</p>
                    )}
                </div>
            )}
        </div>
    )
}