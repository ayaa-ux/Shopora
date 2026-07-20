import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    BarChart2, TrendingUp, Plus, X
} from 'lucide-react'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'
import { getAllProducts, createOffer } from '../api/catalogApi'
import { createSession } from '../api/groupBuyingApi'
import axiosClient from '../api/axiosClient'
import Navbar from '../components/layout/Navbar'

// ─── Constantes ───────────────────────────────────────────────────────────────

const sidebarItems = [
    { to: '/vendor', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/vendor/products', label: 'Produits', icon: Package },
    { to: '/vendor/groups', label: 'Group Buying', icon: Users },
    { to: '/vendor/orders', label: 'Commandes', icon: ShoppingCart },
    { to: '/vendor/stats', label: 'Statistiques', icon: BarChart2 },
]

const DASHBOARD_STATS = [
    { label: 'REVENUS (30J)', value: '17.569 MAD', icon: TrendingUp, color: 'bg-clay/10 text-clay' },
    { label: 'COMMANDES', value: '15', icon: ShoppingCart, color: 'bg-blue-50 text-blue-500' },
    { label: 'GROUPES ACTIFS', value: '4', icon: Users, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'PRODUITS', value: '20', icon: Package, color: 'bg-green-50 text-green-500' },
]

const RECENT_ORDERS = [
    { id: '#o1000', status: 'Commandé', amount: '459 MAD' },
    { id: '#o1001', status: 'Confirmé', amount: '1.440 MAD' },
    { id: '#o1002', status: 'Expédié', amount: '1.620 MAD' },
    { id: '#o1003', status: 'Livré', amount: '280 MAD' },
]

const CATEGORIES = ['Mode', 'Électronique', 'Beauté', 'Sport', 'Maison', 'Alimentation']

const DURATIONS = [
    { label: '6h', value: '6' },
    { label: '12h', value: '12' },
    { label: '24h', value: '24' },
    { label: '48h', value: '48' },
    { label: '72h', value: '72' },
    { label: '1 semaine', value: '168' },
]

// ─── Modale : Nouveau produit ─────────────────────────────────────────────────

function AddProductModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({
        name: '', description: '', category: '',
        imageUrl: '', price: '', stockQuantity: '',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    }

    const validate = () => {
        const newErrors = {}
        if (!form.name.trim()) newErrors.name = 'Obligatoire'
        if (!form.category) newErrors.category = 'Obligatoire'
        if (!form.price || Number(form.price) <= 0) newErrors.price = 'Prix invalide'
        if (!form.stockQuantity || Number(form.stockQuantity) < 0) newErrors.stockQuantity = 'Quantité invalide'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            const productResponse = await axiosClient.post('/api/products', {
                name: form.name,
                description: form.description,
                category: form.category,
                imageUrl: form.imageUrl || null,
            })
            await createOffer({
                productId: productResponse.data.id,
                price: Number(form.price),
                stockQuantity: Number(form.stockQuantity),
            })
            setSuccess(true)
            setTimeout(() => { onSuccess?.(); onClose() }, 1200)
        } catch (error) {
            const data = error.response?.data
            if (data?.fieldErrors) setErrors(data.fieldErrors)
            else setErrors({ general: data?.message || 'Une erreur est survenue.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-display text-xl font-bold text-ink">Nouveau produit</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                {success ? (
                    <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✓</span>
                        </div>
                        <p className="font-semibold text-ink">Produit publié avec succès !</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-ink mb-1">
                                Nom du produit <span className="text-red-400">*</span>
                            </label>
                            <input
                                name="name" value={form.name} onChange={handleChange}
                                placeholder="Ex : Robe florale midi"
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink mb-1">Description</label>
                            <textarea
                                name="description" value={form.description} onChange={handleChange}
                                placeholder="Décrivez votre produit..." rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink mb-1">
                                Catégorie <span className="text-red-400">*</span>
                            </label>
                            <select
                                name="category" value={form.category} onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay bg-white ${errors.category ? 'border-red-300' : 'border-gray-200'}`}
                            >
                                <option value="">Sélectionner une catégorie</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink mb-1">URL de l'image</label>
                            <input
                                name="imageUrl" value={form.imageUrl} onChange={handleChange}
                                placeholder="https://exemple.com/image.jpg"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                            />
                            {form.imageUrl && (
                                <img
                                    src={form.imageUrl} alt="Aperçu"
                                    className="mt-2 w-20 h-20 object-cover rounded-xl border border-gray-200"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">
                                    Prix (MAD) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="price" type="number" value={form.price} onChange={handleChange}
                                    placeholder="299"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.price ? 'border-red-300' : 'border-gray-200'}`}
                                />
                                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">
                                    Stock <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="stockQuantity" type="number" value={form.stockQuantity} onChange={handleChange}
                                    placeholder="10"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.stockQuantity ? 'border-red-300' : 'border-gray-200'}`}
                                />
                                {errors.stockQuantity && <p className="text-xs text-red-500 mt-1">{errors.stockQuantity}</p>}
                            </div>
                        </div>

                        {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                    className="flex-1 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                                Annuler
                            </button>
                            <button type="submit" disabled={loading}
                                    className="flex-1 py-3 bg-clay text-white font-semibold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50">
                                {loading ? 'Publication...' : 'Publier le produit'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

// ─── Modale : Créer un groupe ─────────────────────────────────────────────────

function AddGroupModal({ offers, onClose, onSuccess }) {
    const [form, setForm] = useState({
        productOfferId: '', targetParticipants: '',
        groupPrice: '', durationHours: '24',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    }

    const validate = () => {
        const newErrors = {}
        if (!form.productOfferId) newErrors.productOfferId = 'Sélectionnez une offre'
        if (!form.targetParticipants || Number(form.targetParticipants) < 2)
            newErrors.targetParticipants = 'Minimum 2 participants'
        if (!form.groupPrice || Number(form.groupPrice) <= 0)
            newErrors.groupPrice = 'Prix invalide'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            await createSession({
                productOfferId: Number(form.productOfferId),
                targetParticipants: Number(form.targetParticipants),
                groupPrice: Number(form.groupPrice),
                durationHours: Number(form.durationHours),
            })
            setSuccess(true)
            setTimeout(() => { onSuccess?.(); onClose() }, 1200)
        } catch (error) {
            const data = error.response?.data
            if (data?.fieldErrors) setErrors(data.fieldErrors)
            else setErrors({ general: data?.message || 'Une erreur est survenue.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-display text-xl font-bold text-ink">Créer un groupe d'achat</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                {success ? (
                    <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✓</span>
                        </div>
                        <p className="font-semibold text-ink">Session créée avec succès !</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-ink mb-1">
                                Offre concernée <span className="text-red-400">*</span>
                            </label>
                            {offers.length === 0 ? (
                                <p className="text-sm text-ink-light italic px-4 py-3 bg-gray-50 rounded-xl">
                                    Publiez d'abord un produit depuis l'onglet "Produits".
                                </p>
                            ) : (
                                <select
                                    name="productOfferId" value={form.productOfferId} onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay bg-white ${errors.productOfferId ? 'border-red-300' : 'border-gray-200'}`}
                                >
                                    <option value="">Sélectionner une offre</option>
                                    {offers.map(offer => (
                                        <option key={offer.id} value={offer.id}>
                                            {offer.productName} — {offer.price} MAD
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.productOfferId && <p className="text-xs text-red-500 mt-1">{errors.productOfferId}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">
                                    Participants visés <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="targetParticipants" type="number" value={form.targetParticipants}
                                    onChange={handleChange} placeholder="20" min={2}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.targetParticipants ? 'border-red-300' : 'border-gray-200'}`}
                                />
                                {errors.targetParticipants && <p className="text-xs text-red-500 mt-1">{errors.targetParticipants}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-ink mb-1">
                                    Prix groupé (MAD) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="groupPrice" type="number" value={form.groupPrice}
                                    onChange={handleChange} placeholder="199"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${errors.groupPrice ? 'border-red-300' : 'border-gray-200'}`}
                                />
                                {errors.groupPrice && <p className="text-xs text-red-500 mt-1">{errors.groupPrice}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink mb-2">
                                Durée de la session <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {DURATIONS.map(({ label, value }) => (
                                    <button
                                        key={value} type="button"
                                        onClick={() => setForm({ ...form, durationHours: value })}
                                        className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                                            form.durationHours === value
                                                ? 'bg-clay text-white border-clay'
                                                : 'bg-white text-ink border-gray-200 hover:border-clay'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                    className="flex-1 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                                Annuler
                            </button>
                            <button type="submit" disabled={loading || offers.length === 0}
                                    className="flex-1 py-3 bg-clay text-white font-semibold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50">
                                {loading ? 'Création...' : 'Lancer la session'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

// ─── Layout sidebar ───────────────────────────────────────────────────────────

export function VendorLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex">
                <aside className="w-64 bg-white border-r border-gray-100 shrink-0 min-h-screen">
                    <div className="p-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Espace Vendeur
                        </p>
                        <nav className="space-y-1">
                            {sidebarItems.map(({ to, label, icon: Icon, end }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                            isActive ? 'bg-clay text-white' : 'text-ink hover:bg-gray-50'
                                        }`
                                    }
                                >
                                    <Icon size={18} /> {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </aside>
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

// ─── Tableau de bord ──────────────────────────────────────────────────────────

export function VendorHome() {
    return (
        <div>
            <h1 className="font-display text-3xl font-bold text-ink mb-1">Tableau de bord</h1>
            <p className="text-ink-light text-sm mb-8">Aperçu de votre activité.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {DASHBOARD_STATS.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                            <Icon size={22} />
                        </div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                        <p className="font-bold text-2xl text-ink">{value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-ink mb-4">Activité récente</h2>
                <div className="divide-y divide-gray-50">
                    {RECENT_ORDERS.map(({ id, status, amount }) => (
                        <div key={id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-ink">{id}</span>
                                <span className="text-xs text-gray-400">· {status}</span>
                            </div>
                            <span className="text-sm font-semibold text-ink">{amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Page Produits ────────────────────────────────────────────────────────────

export function VendorProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => { loadProducts() }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            setProducts(await getAllProducts())
        } catch {
            // silencieux
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-3xl font-bold text-ink">Produits</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-clay text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-clay-dark transition-colors"
                >
                    <Plus size={16} /> Nouveau produit
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-5 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <span className="col-span-2">Produit</span>
                    <span>Catégorie</span>
                    <span>Prix</span>
                    <span>Stock</span>
                </div>

                {loading && <p className="text-center text-ink-light py-10">Chargement...</p>}

                {!loading && products.length === 0 && (
                    <div className="text-center py-12">
                        <Package size={32} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-ink-light text-sm">Aucun produit pour le moment.</p>
                        <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm text-clay font-medium hover:underline">
                            Ajouter votre premier produit
                        </button>
                    </div>
                )}

                {products.map(p => (
                    <div key={p.id} className="grid grid-cols-5 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div className="col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                            </div>
                            <span className="text-sm font-medium text-ink truncate">{p.name}</span>
                        </div>
                        <span className="text-sm text-gray-400">{p.category}</span>
                        <span className="text-sm font-semibold text-ink">
              {p.lowestPrice ? `${p.lowestPrice} MAD` : '—'}
            </span>
                        <span className="text-sm text-ink-light">—</span>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={loadProducts} />
            )}
        </>
    )
}

// ─── Page Group Buying ────────────────────────────────────────────────────────

export function VendorGroups() {
    const [offers, setOffers] = useState([])
    const [sessions, setSessions] = useState([])
    const [loadingSessions, setLoadingSessions] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        loadOffers()
        loadSessions()
    }, [])

    const loadOffers = async () => {
        try {
            const response = await axiosClient.get('/api/offers/my-offers')
            setOffers(response.data)
        } catch {
            // silencieux
        }
    }

    const loadSessions = async () => {
        setLoadingSessions(true)
        try {
            // Essaie d'abord /api/sessions/my-sessions (filtré par vendeur)
            // Si ça échoue, fallback sur /api/sessions
            let response
            try {
                response = await axiosClient.get('/api/sessions/my-sessions')
            } catch {
                response = await axiosClient.get('/api/sessions')
            }

            // Filtre côté frontend par les offres du vendeur actuel
            const myOfferIds = offers.map(o => o.id)
            const mySessions = response.data.filter(s =>
                myOfferIds.includes(s.productOfferId)
            )
            setSessions(mySessions.length > 0 ? mySessions : response.data)
        } catch {
            setSessions([])
        } finally {
            setLoadingSessions(false)
        }
    }

    const STATUS_COLORS = {
        ACTIVE: 'bg-green-50 text-green-600',
        SUCCESSFUL: 'bg-blue-50 text-blue-600',
        FAILED: 'bg-red-50 text-red-500',
    }

    const STATUS_LABELS = {
        ACTIVE: 'Active',
        SUCCESSFUL: 'Réussie',
        FAILED: 'Échouée',
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-3xl font-bold text-ink">Group Buying</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-clay text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-clay-dark transition-colors"
                >
                    <Plus size={16} /> Créer un groupe
                </button>
            </div>

            {/* Liste des sessions */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-5 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <span className="col-span-2">Produit / Offre</span>
                    <span>Participants</span>
                    <span>Prix groupé</span>
                    <span>Statut</span>
                </div>

                {loadingSessions && (
                    <p className="text-center text-ink-light py-10">Chargement...</p>
                )}

                {!loadingSessions && sessions.length === 0 && (
                    <div className="text-center py-12">
                        <Users size={32} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-ink-light text-sm">Aucune session créée pour le moment.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-3 text-sm text-clay font-medium hover:underline"
                        >
                            Créer votre première session
                        </button>
                    </div>
                )}

                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className="grid grid-cols-5 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-ink">
                                Offre #{session.productOfferId}
                            </p>
                            <p className="text-xs text-ink-light">
                                Durée : {session.remainingSeconds > 0
                                ? `${Math.floor(session.remainingSeconds / 3600)}h restantes`
                                : 'Expirée'}
                            </p>
                        </div>

                        {/* Barre participants */}
                        <div>
                            <p className="text-sm text-ink mb-1">
                                {session.currentParticipants}/{session.targetParticipants}
                            </p>
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-clay rounded-full"
                                    style={{
                                        width: `${Math.min(
                                            (session.currentParticipants / session.targetParticipants) * 100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <span className="text-sm font-bold text-clay">
              {session.groupPrice} MAD
            </span>

                        <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${
                            STATUS_COLORS[session.status] || 'bg-gray-50 text-gray-500'
                        }`}>
              {STATUS_LABELS[session.status] || session.status}
            </span>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <AddGroupModal
                    offers={offers}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadSessions}
                />
            )}
        </>
    )
}

// ─── Page Commandes ───────────────────────────────────────────────────────────

export function VendorOrders() {
    const [filter, setFilter] = useState('Tout')

    const ORDERS = [
        { id: '#o1000', product: 'Robe florale midi', client: 'sara@example.com', date: '6 juin 2026', amount: 459, status: 'Commandé', group: true },
        { id: '#o1001', product: 'Sac en cuir bordeaux', client: 'yassine@example.com', date: '5 juin 2026', amount: 1440, status: 'Confirmé', group: false },
        { id: '#o1002', product: 'Sneakers blanches', client: 'nadia@example.com', date: '4 juin 2026', amount: 1620, status: 'Expédié', group: false },
        { id: '#o1003', product: 'Sérum éclat à la rose', client: 'sara@example.com', date: '3 juin 2026', amount: 280, status: 'Livré', group: true },
        { id: '#o1004', product: 'Palette champagne', client: 'leila@example.com', date: '2 juin 2026', amount: 320, status: 'Livré', group: false },
        { id: '#o1005', product: "Parfum oud d'or", client: 'omar@example.com', date: '1 juin 2026', amount: 890, status: 'Commandé', group: false },
    ]

    const STATUS_COLORS = {
        'Commandé': 'bg-blue-50 text-blue-600',
        'Confirmé': 'bg-yellow-50 text-yellow-600',
        'Expédié': 'bg-purple-50 text-purple-600',
        'Livré': 'bg-green-50 text-green-600',
    }

    const FILTERS = ['Tout', 'Commandé', 'Confirmé', 'Expédié', 'Livré']
    const filtered = filter === 'Tout' ? ORDERS : ORDERS.filter(o => o.status === filter)

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-3xl font-bold text-ink">Commandes</h1>
                <p className="text-ink-light text-sm mt-1">{filtered.length} commande(s)</p>
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
                {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                filter === f ? 'bg-clay text-white border-clay' : 'bg-white text-ink border-gray-200 hover:border-clay'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-6 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <span>Commande</span>
                    <span className="col-span-2">Produit</span>
                    <span>Date</span>
                    <span>Montant</span>
                    <span>Statut</span>
                </div>

                {filtered.length === 0 && (
                    <p className="text-center text-ink-light py-12">Aucune commande.</p>
                )}

                {filtered.map(order => (
                    <div key={order.id} className="grid grid-cols-6 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="text-sm font-semibold text-ink">{order.id}</p>
                            {order.group && (
                                <span className="text-[10px] bg-quartz-light text-clay px-2 py-0.5 rounded-full font-medium">
                  Achat groupé
                </span>
                            )}
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-ink truncate">{order.product}</p>
                            <p className="text-xs text-ink-light">{order.client}</p>
                        </div>
                        <span className="text-sm text-ink-light">{order.date}</span>
                        <span className="text-sm font-bold text-clay">{order.amount.toLocaleString()} MAD</span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${STATUS_COLORS[order.status]}`}>
              {order.status}
            </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Page Statistiques ────────────────────────────────────────────────────────

export function VendorStats() {
    const REVENUE_DATA = [
        { day: 'J1', revenue: 6200 }, { day: 'J3', revenue: 4800 },
        { day: 'J5', revenue: 7100 }, { day: 'J7', revenue: 5400 },
        { day: 'J9', revenue: 8200 }, { day: 'J12', revenue: 6700 },
        { day: 'J15', revenue: 7900 }, { day: 'J18', revenue: 9400 },
        { day: 'J21', revenue: 8800 }, { day: 'J24', revenue: 7200 },
        { day: 'J27', revenue: 8500 }, { day: 'J30', revenue: 9100 },
    ]

    const TOP_PRODUCTS = [
        { name: 'Casque audio', sales: 120 },
        { name: 'Sérum rose', sales: 95 },
        { name: 'Sneakers', sales: 88 },
        { name: 'Sac cuir', sales: 67 },
        { name: 'Robe midi', sales: 54 },
    ]

    const GROUP_SUCCESS = [
        { name: 'Réussies', value: 7, color: '#8C9A7B' },
        { name: 'Échouées', value: 2, color: '#E8C9C5' },
        { name: 'En cours', value: 4, color: '#C98C82' },
    ]

    const KPI = [
        { label: 'Revenu total (30j)', value: '17.569 MAD', delta: '+12%' },
        { label: 'Taux de conversion', value: '68%', delta: '+4%' },
        { label: 'Panier moyen', value: '456 MAD', delta: '+8%' },
        { label: 'Taux succès groupes', value: '78%', delta: '+5%' },
    ]

    return (
        <div>
            <h1 className="font-display text-3xl font-bold text-ink mb-1">Statistiques</h1>
            <p className="text-ink-light text-sm mb-8">30 derniers jours</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {KPI.map(({ label, value, delta }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="font-bold text-2xl text-ink">{value}</p>
                        <p className="text-xs text-green-500 font-medium mt-1">{delta} vs mois précédent</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-ink mb-5">Revenus (30 derniers jours)</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={REVENUE_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }}
                                formatter={(value) => [`${value} MAD`, 'Revenus']}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#C98C82" strokeWidth={2.5} dot={false}
                                  activeDot={{ r: 5, fill: '#C98C82' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-ink mb-5">Top produits (ventes)</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={TOP_PRODUCTS} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }}
                                   axisLine={false} tickLine={false} width={80} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }}
                                formatter={(value) => [value, 'Ventes']}
                            />
                            <Bar dataKey="sales" fill="#C99B50" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-ink mb-5">Taux de succès des achats groupés</h2>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                            <Pie data={GROUP_SUCCESS} cx="50%" cy="50%"
                                 innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                {GROUP_SUCCESS.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                        {GROUP_SUCCESS.map(({ name, value, color }) => (
                            <div key={name} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-sm text-ink">{name}</span>
                                <span className="font-bold text-ink ml-4">{value} sessions</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}