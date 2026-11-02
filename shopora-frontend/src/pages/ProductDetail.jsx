import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Shield, Truck } from 'lucide-react'
import { getProductById, getOffersByProduct, createOffer, getSimilarProducts } from '../api/catalogApi'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { role, email } = useAuthStore()
    const addItem = useCartStore((state) => state.addItem)

    const [product, setProduct] = useState(null)
    const [offers, setOffers] = useState([])
    const [similar, setSimilar] = useState([])
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
            // Le comparateur de produits similaires ne doit jamais bloquer la page
            getSimilarProducts(id).then(setSimilar).catch(() => setSimilar([]))
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

    // Meilleure offre EN STOCK de ce produit
    const bestOffer = offers.find((o) => o.stockQuantity > 0) || offers[0]
    // Un produit similaire est-il moins cher ?
    const cheaperSimilar = similar
        .filter((p) => p.bestPrice != null && (!bestOffer || Number(p.bestPrice) < Number(bestOffer.price)))
        .sort((a, b) => Number(a.bestPrice) - Number(b.bestPrice))[0]
    const saving = cheaperSimilar && bestOffer
        ? (Number(bestOffer.price) - Number(cheaperSimilar.bestPrice)).toFixed(2).replace(/\.00$/, '')
        : null

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Retour */}
            <button
                onClick={() => navigate('/catalogue')}
                className="flex items-center gap-2 text-sm text-ink-light hover:text-ink mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Catalogue
            </button>

            {cheaperSimilar && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-ink">
                        <strong>Meilleur prix ailleurs :</strong> « {cheaperSimilar.name} » est proposé à{' '}
                        <strong>{cheaperSimilar.bestPrice} MAD</strong>
                        {saving ? <> — vous économisez <strong>{saving} MAD</strong></> : null}.
                    </p>
                    <button
                        onClick={() => navigate(`/catalogue/${cheaperSimilar.id}`)}
                        className="text-sm font-semibold text-clay hover:text-clay-dark"
                    >
                        Voir l'offre →
                    </button>
                </div>
            )}

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

            {/* Produits similaires : comparaison des prix entre fiches proches */}
            {similar.length > 0 && (
                <div className="mt-12">
                    <h2 className="font-display text-2xl font-bold text-ink mb-2">
                        Produits similaires
                    </h2>
                    <p className="text-ink-light text-sm mb-6">
                        Le même article vendu sous une autre fiche : comparez et gardez le meilleur prix.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {similar.map((p) => {
                            const isBest = p.bestPrice != null && p.id === similar.find((x) => x.bestPrice != null)?.id
                                && (!bestOffer || Number(p.bestPrice) < Number(bestOffer.price))
                            const diff = p.bestPrice != null && bestOffer
                                ? Number(p.bestPrice) - Number(bestOffer.price) : null
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => navigate(`/catalogue/${p.id}`)}
                                    className="text-left border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="aspect-[4/3] bg-gray-50">
                                        {p.imageUrl && (
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                                        {p.bestPrice != null ? (
                                            <>
                                                <p className="font-bold text-lg text-ink mt-1">{p.bestPrice} MAD</p>
                                                <p className="text-xs text-gray-400 truncate">{p.bestVendorEmail}</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {isBest && (
                                                        <span className="text-[10px] bg-clay text-white px-2 py-0.5 rounded-full font-medium">
                                                            MEILLEUR PRIX
                                                        </span>
                                                    )}
                                                    {diff !== null && diff !== 0 && (
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                            diff < 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {diff < 0 ? `${Math.abs(diff).toFixed(2).replace(/\.00$/, '')} MAD moins cher`
                                                                : `+${diff.toFixed(2).replace(/\.00$/, '')} MAD`}
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-ink-light italic mt-1">Indisponible</p>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

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