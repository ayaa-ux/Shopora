import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllProducts, getOffersByProduct, getOfferById, getProductById, getSimilarProducts } from '../api/catalogApi'
import { getActiveSessions } from '../api/groupBuyingApi'
import HeroSection from '../components/home/HeroSection'
import FeaturedGroupCard from '../components/home/FeaturedGroupCard'
import ComparatorShowcase from '../components/home/ComparatorShowcase'
import AssistantShowcase from '../components/home/AssistantShowcase'
import CTASection from '../components/home/CTASection'
import Footer from '../components/home/Footer'
import { ShoppingBag } from 'lucide-react'

function PopularProductCard({ product, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
        >
            <div className="aspect-square bg-gray-50 overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 text-sm">
                        Pas d'image
                    </div>
                )}
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ShopOra</p>
                <h3 className="font-semibold text-ink text-sm mb-1 truncate">{product.name}</h3>
                <div className="flex items-center justify-between">
          <span className="font-bold text-ink text-sm">
            {product.lowestPrice ? `${product.lowestPrice} MAD` : 'Non disponible'}
          </span>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-ink-light hover:bg-quartz-light hover:text-clay transition-colors"
                    >
                        <ShoppingBag size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function Home() {
    const navigate = useNavigate()
    const [featuredGroups, setFeaturedGroups] = useState([])
    const [popularProducts, setPopularProducts] = useState([])
    const [comparatorRows, setComparatorRows] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadHomeData()
    }, [])

    const loadHomeData = async () => {
        setLoading(true)
        try {
            const [sessions, products] = await Promise.all([
                getActiveSessions(),
                getAllProducts(),
            ])

            // Top 3 sessions les plus proches de leur objectif
            const topSessions = [...sessions]
                .sort((a, b) =>
                    b.currentParticipants / b.targetParticipants -
                    a.currentParticipants / a.targetParticipants
                )
                .slice(0, 3)

            // Enrichit chaque session avec le nom et l'image du produit
            const enriched = await Promise.all(
                topSessions.map(async (session) => {
                    try {
                        const offer = await getOfferById(session.productOfferId)
                        const product = await getProductById(offer.productId)
                        return {
                            sessionId: session.id,
                            productName: offer.productName,
                            imageUrl: product.imageUrl,
                            originalPrice: offer.price,
                            groupPrice: session.groupPrice,
                            currentParticipants: session.currentParticipants,
                            targetParticipants: session.targetParticipants,
                            urgent: session.remainingSeconds < 3600,
                        }
                    } catch {
                        return null
                    }
                })
            )
            setFeaturedGroups(enriched.filter(Boolean))

            // Produits populaires : les 4 premiers avec au moins une offre
            setPopularProducts(products.slice(0, 4))

            // Comparateur : on prend, parmi les produits ayant des offres, celui qui offre
            // le plus de choix (ses offres + les produits similaires), triés par prix
            const candidates = products.filter(p => p.lowestPrice !== null).slice(0, 8)
            const analysed = await Promise.all(candidates.map(async (p) => {
                try {
                    const [offers, similar] = await Promise.all([
                        getOffersByProduct(p.id),
                        getSimilarProducts(p.id).catch(() => []),
                    ])
                    const rows = [
                        ...offers.map(o => ({
                            key: `o${o.id}`, productId: p.id, productName: p.name,
                            vendorEmail: o.vendorEmail, price: Number(o.price), stock: o.stockQuantity,
                        })),
                        ...similar.filter(x => x.bestPrice != null).map(x => ({
                            key: `s${x.bestOfferId}`, productId: x.id, productName: x.name,
                            vendorEmail: x.bestVendorEmail, price: Number(x.bestPrice), stock: null,
                        })),
                    ].filter(r => r.stock === null || r.stock > 0)
                    return rows
                } catch {
                    return []
                }
            }))
            const best = analysed.sort((a, b) => b.length - a.length)[0] || []
            setComparatorRows([...best].sort((a, b) => a.price - b.price))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white">
            {/* Hero */}
            <HeroSection featuredSession={featuredGroups[0]} />

            {/* Groupes actifs en vedette */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                            Groupes actifs en vedette
                        </h2>
                        <p className="text-ink-light text-sm mt-1">
                            Rejoignez avant la fin du timer.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/group-buying')}
                        className="text-sm text-clay font-medium hidden sm:block hover:underline"
                    >
                        Voir tous les groupes →
                    </button>
                </div>

                {loading && (
                    <p className="text-ink-light text-sm">Chargement...</p>
                )}
                {!loading && featuredGroups.length === 0 && (
                    <p className="text-ink-light text-sm italic">
                        Aucune session active pour le moment.
                    </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {featuredGroups.map((group, index) => (
                        <FeaturedGroupCard
                            key={group.sessionId}
                            group={group}
                            index={index}
                        />
                    ))}
                </div>
            </section>

            {/* Comparateur de prix */}
            <ComparatorShowcase rows={comparatorRows} />

            {/* Assistant IA */}
            <AssistantShowcase />

            {/* Produits populaires */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                            Produits populaires
                        </h2>
                        <p className="text-ink-light text-sm mt-1">
                            Les coups de cœur de la communauté.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/catalogue')}
                        className="text-sm text-clay font-medium hidden sm:block hover:underline"
                    >
                        Tout voir →
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    {loading
                        ? [1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
                        ))
                        : popularProducts.map(product => (
                            <PopularProductCard
                                key={product.id}
                                product={product}
                                onClick={() => navigate(`/catalogue/${product.id}`)}
                            />
                        ))
                    }
                </div>
            </section>

            {/* CTA Gradient (visiteurs non connectés uniquement) */}
            <CTASection />

            {/* Footer */}
            <Footer />
        </div>
    )
}