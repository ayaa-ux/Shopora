import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getAllProducts, searchProducts } from '../api/catalogApi'

function ProductCard({ product, onClick }) {
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
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        Pas d'image
                    </div>
                )}
            </div>
            <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                    {product.category}
                </p>
                <h3 className="font-semibold text-ink text-sm mb-2 truncate">{product.name}</h3>
                <span className="font-bold text-ink">
                    {product.lowestPrice ? `${product.lowestPrice} MAD` : 'Non disponible'}
                </span>
            </div>
        </div>
    )
}

const CATEGORIES = ['Tout', 'Mode', 'Électronique', 'Beauté', 'Sport', 'Maison']

export default function Catalogue() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const urlKeyword = searchParams.get('search') || ''

    const [products, setProducts] = useState([])
    const [keyword, setKeyword] = useState(urlKeyword)
    const [activeCategory, setActiveCategory] = useState('Tout')
    const [loading, setLoading] = useState(true)

    // La recherche suit l'URL : la recherche de la Navbar (/catalogue?search=...)
    // filtre maintenant réellement la liste, même si on est déjà sur la page.
    useEffect(() => {
        setKeyword(urlKeyword)
        load(urlKeyword)
    }, [urlKeyword])

    const load = async (kw) => {
        setLoading(true)
        try {
            setProducts(kw.trim() ? await searchProducts(kw.trim()) : await getAllProducts())
        } catch {
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setSearchParams(keyword.trim() ? { search: keyword.trim() } : {})
    }

    const filtered = activeCategory === 'Tout'
        ? products
        : products.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase())

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="font-display text-3xl text-ink font-bold">Catalogue</h1>
                <p className="text-ink-light mt-1">
                    {filtered.length} produit(s){urlKeyword && ` pour « ${urlKeyword} »`}.
                </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-8 items-center">
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Rechercher un produit..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                    />
                </form>

                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                activeCategory === cat
                                    ? 'bg-clay text-white border-clay'
                                    : 'bg-white text-ink border-gray-200 hover:border-clay'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading && <p className="text-center text-ink-light py-20">Chargement...</p>}

            {!loading && filtered.length === 0 && (
                <p className="text-center text-ink-light py-20">Aucun produit trouvé.</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {filtered.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => navigate(`/catalogue/${product.id}`)}
                    />
                ))}
            </div>
        </div>
    )
}