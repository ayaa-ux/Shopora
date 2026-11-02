import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
    LayoutDashboard, Package, Users, ShoppingCart, BarChart2,
    Plus, X, Pencil, Trash2, Check,
} from 'lucide-react'
import {
    getMyOffers, getAllProducts, createProduct, createOffer, updateOffer, deleteOffer, findSimilarByName,
} from '../api/catalogApi'
import { createSession, getMySessions, updateSession, deleteSession } from '../api/groupBuyingApi'
import Navbar from '../components/layout/Navbar'

// Commandes et statistiques (données de démonstration) : voir VendorExtras.jsx
export { VendorOrders, VendorStats } from './VendorExtras'

const sidebarItems = [
    { to: '/vendor', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/vendor/products', label: 'Produits', icon: Package },
    { to: '/vendor/groups', label: 'Group Buying', icon: Users },
    { to: '/vendor/orders', label: 'Commandes', icon: ShoppingCart },
    { to: '/vendor/stats', label: 'Statistiques', icon: BarChart2 },
]

const CATEGORIES = ['Mode', 'Électronique', 'Beauté', 'Sport', 'Maison', 'Alimentation']

const DURATIONS = [
    { label: '6h', value: '6' }, { label: '12h', value: '12' }, { label: '24h', value: '24' },
    { label: '48h', value: '48' }, { label: '72h', value: '72' }, { label: '1 semaine', value: '168' },
]

const STATUS_COLORS = {
    ACTIVE: 'bg-green-50 text-green-600',
    SUCCESSFUL: 'bg-blue-50 text-blue-600',
    FAILED: 'bg-red-50 text-red-500',
}
const STATUS_LABELS = { ACTIVE: 'Active', SUCCESSFUL: 'Réussie', FAILED: 'Échouée' }

const inputCls = (error) =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
        error ? 'border-red-300' : 'border-gray-200'
    }`

// ─── Petits composants partagés ───────────────────────────────────────────────

function Field({ label, error, required, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-ink mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

function ModalShell({ title, onClose, success, successText, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={18} /></button>
                </div>
                {success ? (
                    <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✓</span>
                        </div>
                        <p className="font-semibold text-ink">{successText}</p>
                    </div>
                ) : children}
            </div>
        </div>
    )
}

function ModalButtons({ onClose, loading, label, loadingLabel, disabled }) {
    return (
        <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
            </button>
            <button type="submit" disabled={loading || disabled}
                    className="flex-1 py-3 bg-clay text-white font-semibold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50">
                {loading ? loadingLabel : label}
            </button>
        </div>
    )
}

function useModalForm(initial, validate, submit, onSuccess, onClose) {
    const [form, setForm] = useState(initial)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const found = validate(form)
        setErrors(found)
        if (Object.keys(found).length > 0) return
        setLoading(true)
        try {
            await submit(form)
            setSuccess(true)
            setTimeout(() => { onSuccess?.(); onClose() }, 1000)
        } catch (error) {
            const data = error.response?.data
            setErrors(data?.fieldErrors || { general: data?.message || 'Une erreur est survenue.' })
        } finally {
            setLoading(false)
        }
    }

    return { form, setForm, errors, loading, success, handleChange, handleSubmit }
}

// ─── Modale : Nouveau produit ─────────────────────────────────────────────────

function AddProductModal({ onClose, onSuccess }) {
    // Doublons détectés + fiche existante choisie par le vendeur
    const [duplicates, setDuplicates] = useState([])
    const [existing, setExisting] = useState(null)
    const { form, errors, loading, success, handleChange, handleSubmit } = useModalForm(
        { name: '', description: '', category: '', imageUrl: '', price: '', stockQuantity: '' },
        (f) => {
            const e = {}
            if (!f.name.trim()) e.name = 'Obligatoire'
            if (!f.category) e.category = 'Obligatoire'
            if (!f.price || Number(f.price) <= 0) e.price = 'Prix invalide'
            if (f.stockQuantity === '' || Number(f.stockQuantity) < 0) e.stockQuantity = 'Quantité invalide'
            return e
        },
        async (f) => {
            // Si le vendeur choisit une fiche existante, on ajoute seulement son offre
            const product = existing || await createProduct({
                name: f.name,
                description: f.description,
                category: f.category,
                imageUrl: f.imageUrl || null,
            })
            await createOffer({
                productId: product.id,
                price: Number(f.price),
                stockQuantity: Number(f.stockQuantity),
            })
        },
        onSuccess,
        onClose
    )

    // Recherche de fiches similaires (anti-doublon) dès que nom + catégorie sont saisis
    useEffect(() => {
        setExisting(null)
        if (form.name.trim().length < 3 || !form.category) { setDuplicates([]); return }
        const timer = setTimeout(() => {
            findSimilarByName(form.name.trim(), form.category)
                .then(setDuplicates).catch(() => setDuplicates([]))
        }, 400)
        return () => clearTimeout(timer)
    }, [form.name, form.category])

    return (
        <ModalShell title="Nouveau produit" onClose={onClose} success={success} successText="Produit publié avec succès !">
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <Field label="Nom du produit" required error={errors.name}>
                    <input name="name" value={form.name} onChange={handleChange}
                           placeholder="Ex : Robe florale midi" className={inputCls(errors.name)} />
                </Field>

                {duplicates.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                        <p className="text-xs text-ink">
                            Ce produit existe peut-être déjà. Publiez votre prix sur la fiche existante
                            pour que les clients puissent comparer les vendeurs :
                        </p>
                        {duplicates.slice(0, 3).map((d) => (
                            <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" name="existingProduct"
                                       checked={existing?.id === d.id}
                                       onChange={() => setExisting(d)} />
                                <span className="flex-1 truncate">{d.name}</span>
                                <span className="text-xs text-gray-500">
                                    {d.bestPrice != null ? `dès ${d.bestPrice} MAD` : 'sans offre'}
                                </span>
                            </label>
                        ))}
                        {existing && (
                            <button type="button" onClick={() => setExisting(null)}
                                    className="text-xs text-clay underline">
                                Non, créer une nouvelle fiche
                            </button>
                        )}
                    </div>
                )}

                <Field label="Description">
                    <textarea name="description" value={form.description} onChange={handleChange}
                              placeholder="Décrivez votre produit..." rows={3}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay resize-none" />
                </Field>

                <Field label="Catégorie" required error={errors.category}>
                    <select name="category" value={form.category} onChange={handleChange}
                            className={`${inputCls(errors.category)} bg-white`}>
                        <option value="">Sélectionner une catégorie</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </Field>

                <Field label="URL de l'image">
                    <input name="imageUrl" value={form.imageUrl} onChange={handleChange}
                           placeholder="https://exemple.com/image.jpg" className={inputCls(false)} />
                    {form.imageUrl && (
                        <img src={form.imageUrl} alt="Aperçu"
                             className="mt-2 w-20 h-20 object-cover rounded-xl border border-gray-200"
                             onError={(e) => { e.target.style.display = 'none' }} />
                    )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Prix (MAD)" required error={errors.price}>
                        <input name="price" type="number" min="0" step="0.01" value={form.price}
                               onChange={handleChange} placeholder="299" className={inputCls(errors.price)} />
                    </Field>
                    <Field label="Stock" required error={errors.stockQuantity}>
                        <input name="stockQuantity" type="number" min="0" value={form.stockQuantity}
                               onChange={handleChange} placeholder="10" className={inputCls(errors.stockQuantity)} />
                    </Field>
                </div>

                {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}
                <ModalButtons onClose={onClose} loading={loading} label="Publier le produit" loadingLabel="Publication..." />
            </form>
        </ModalShell>
    )
}

// ─── Modale : Créer un groupe ─────────────────────────────────────────────────

function AddGroupModal({ offers, onClose, onSuccess }) {
    const { form, setForm, errors, loading, success, handleChange, handleSubmit } = useModalForm(
        { productOfferId: '', targetParticipants: '', groupPrice: '', durationHours: '24' },
        (f) => {
            const e = {}
            const offer = offers.find((o) => String(o.id) === f.productOfferId)
            if (!f.productOfferId) e.productOfferId = 'Sélectionnez une offre'
            if (!f.targetParticipants || Number(f.targetParticipants) < 2) e.targetParticipants = 'Minimum 2 participants'
            if (!f.groupPrice || Number(f.groupPrice) <= 0) e.groupPrice = 'Prix invalide'
            // Règle métier : le prix groupé doit réellement être une remise
            else if (offer && Number(f.groupPrice) >= Number(offer.price)) {
                e.groupPrice = `Doit être inférieur au prix de l'offre (${offer.price} MAD)`
            }
            return e
        },
        (f) => createSession({
            productOfferId: Number(f.productOfferId),
            targetParticipants: Number(f.targetParticipants),
            groupPrice: Number(f.groupPrice),
            durationHours: Number(f.durationHours),
        }),
        onSuccess,
        onClose
    )

    return (
        <ModalShell title="Créer un groupe d'achat" onClose={onClose} success={success} successText="Session créée avec succès !">
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <Field label="Offre concernée" required error={errors.productOfferId}>
                    {offers.length === 0 ? (
                        <p className="text-sm text-ink-light italic px-4 py-3 bg-gray-50 rounded-xl">
                            Publiez d'abord un produit depuis l'onglet "Produits".
                        </p>
                    ) : (
                        <select name="productOfferId" value={form.productOfferId} onChange={handleChange}
                                className={`${inputCls(errors.productOfferId)} bg-white`}>
                            <option value="">Sélectionner une offre</option>
                            {offers.map((o) => (
                                <option key={o.id} value={o.id}>{o.productName} — {o.price} MAD</option>
                            ))}
                        </select>
                    )}
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Participants visés" required error={errors.targetParticipants}>
                        <input name="targetParticipants" type="number" min={2} value={form.targetParticipants}
                               onChange={handleChange} placeholder="20" className={inputCls(errors.targetParticipants)} />
                    </Field>
                    <Field label="Prix groupé (MAD)" required error={errors.groupPrice}>
                        <input name="groupPrice" type="number" min="0" step="0.01" value={form.groupPrice}
                               onChange={handleChange} placeholder="199" className={inputCls(errors.groupPrice)} />
                    </Field>
                </div>

                <Field label="Durée de la session" required>
                    <div className="grid grid-cols-3 gap-2">
                        {DURATIONS.map(({ label, value }) => (
                            <button key={value} type="button"
                                    onClick={() => setForm({ ...form, durationHours: value })}
                                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                                        form.durationHours === value
                                            ? 'bg-clay text-white border-clay'
                                            : 'bg-white text-ink border-gray-200 hover:border-clay'
                                    }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </Field>

                {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}
                <ModalButtons onClose={onClose} loading={loading} disabled={offers.length === 0}
                              label="Lancer la session" loadingLabel="Création..." />
            </form>
        </ModalShell>
    )
}

// ─── Layout sidebar ───────────────────────────────────────────────────────────

// ─── Modale : Modifier un groupe (session active sans participant) ───────────

function EditGroupModal({ session, offers, onClose, onSuccess }) {
    const offer = offers.find((o) => o.id === session.productOfferId)
    const remainingHours = Math.max(1, Math.ceil((session.remainingSeconds || 0) / 3600))

    const { form, setForm, errors, loading, success, handleChange, handleSubmit } = useModalForm(
        {
            targetParticipants: String(session.targetParticipants),
            groupPrice: String(session.groupPrice),
            durationHours: String(remainingHours),
        },
        (f) => {
            const e = {}
            if (!f.targetParticipants || Number(f.targetParticipants) < 2) e.targetParticipants = 'Minimum 2 participants'
            if (!f.groupPrice || Number(f.groupPrice) <= 0) e.groupPrice = 'Prix invalide'
            else if (offer && Number(f.groupPrice) >= Number(offer.price)) {
                e.groupPrice = `Doit être inférieur au prix de l'offre (${offer.price} MAD)`
            }
            if (!f.durationHours || Number(f.durationHours) < 1) e.durationHours = 'Minimum 1 heure'
            return e
        },
        (f) => updateSession(session.id, {
            targetParticipants: Number(f.targetParticipants),
            groupPrice: Number(f.groupPrice),
            durationHours: Number(f.durationHours),
        }),
        onSuccess,
        onClose
    )

    return (
        <ModalShell title="Modifier le groupe" onClose={onClose} success={success} successText="Session modifiée !">
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <p className="text-sm text-ink-light">
                    Offre : <b className="text-ink">{offer?.productName || `#${session.productOfferId}`}</b>
                    {offer && <> — prix normal {offer.price} MAD</>}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Participants visés" required error={errors.targetParticipants}>
                        <input name="targetParticipants" type="number" min={2} value={form.targetParticipants}
                               onChange={handleChange} className={inputCls(errors.targetParticipants)} />
                    </Field>
                    <Field label="Prix groupé (MAD)" required error={errors.groupPrice}>
                        <input name="groupPrice" type="number" min="0" step="0.01" value={form.groupPrice}
                               onChange={handleChange} className={inputCls(errors.groupPrice)} />
                    </Field>
                </div>

                <Field label="Durée à partir de maintenant (heures)" required error={errors.durationHours}>
                    <input name="durationHours" type="number" min={1} value={form.durationHours}
                           onChange={handleChange} className={inputCls(errors.durationHours)} />
                </Field>

                {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}
                <ModalButtons onClose={onClose} loading={loading} label="Enregistrer" loadingLabel="Enregistrement..." />
            </form>
        </ModalShell>
    )
}

export function VendorLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex flex-col md:flex-row">
                <aside className="md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-100 shrink-0 md:min-h-screen">
                    <div className="p-4 md:p-6">
                        <p className="hidden md:block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Espace Vendeur
                        </p>
                        <nav className="flex md:flex-col gap-1 overflow-x-auto">
                            {sidebarItems.map(({ to, label, icon: Icon, end }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
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
                <main className="flex-1 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

// ─── Tableau de bord (données RÉELLES) ────────────────────────────────────────

export function VendorHome() {
    const [offers, setOffers] = useState([])
    const [sessions, setSessions] = useState([])

    useEffect(() => {
        getMyOffers().then(setOffers).catch(() => {})
        getMySessions().then(setSessions).catch(() => {})
    }, [])

    const stats = [
        { label: 'MES OFFRES', value: offers.length, icon: Package, color: 'bg-clay/10 text-clay' },
        { label: 'STOCK TOTAL', value: offers.reduce((s, o) => s + (o.stockQuantity || 0), 0), icon: ShoppingCart, color: 'bg-blue-50 text-blue-500' },
        { label: 'GROUPES ACTIFS', value: sessions.filter((s) => s.status === 'ACTIVE').length, icon: Users, color: 'bg-yellow-50 text-yellow-600' },
        { label: 'GROUPES RÉUSSIS', value: sessions.filter((s) => s.status === 'SUCCESSFUL').length, icon: BarChart2, color: 'bg-green-50 text-green-500' },
    ]

    return (
        <div>
            <h1 className="font-display text-3xl font-bold text-ink mb-1">Tableau de bord</h1>
            <p className="text-ink-light text-sm mb-8">Aperçu de votre activité.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(({ label, value, icon: Icon, color }) => (
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
                <h2 className="font-semibold text-ink mb-4">Dernières sessions</h2>
                {sessions.length === 0 ? (
                    <p className="text-sm text-ink-light">Aucune session pour le moment.</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {sessions.slice(0, 5).map((s) => (
                            <div key={s.id} className="flex items-center justify-between py-3">
                                <span className="text-sm font-medium text-ink">
                                    Session #{s.id}
                                    <span className="text-xs text-gray-400"> · {s.currentParticipants}/{s.targetParticipants}</span>
                                </span>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[s.status] || ''}`}>
                                    {STATUS_LABELS[s.status] || s.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Produits : MES offres (modifiables / supprimables) ──────────────────────

export function VendorProducts() {
    const [offers, setOffers] = useState([])
    const [productsById, setProductsById] = useState({})
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [draft, setDraft] = useState({ price: '', stockQuantity: '' })
    const [error, setError] = useState('')

    useEffect(() => { load() }, [])

    const load = async () => {
        setLoading(true)
        try {
            const [myOffers, products] = await Promise.all([getMyOffers(), getAllProducts()])
            setOffers(myOffers)
            setProductsById(Object.fromEntries(products.map((p) => [p.id, p])))
        } catch {
            setError('Impossible de charger vos produits.')
        } finally {
            setLoading(false)
        }
    }

    const startEdit = (offer) => {
        setEditingId(offer.id)
        setDraft({ price: String(offer.price), stockQuantity: String(offer.stockQuantity) })
        setError('')
    }

    const saveEdit = async (offer) => {
        try {
            await updateOffer(offer.id, {
                productId: offer.productId,
                price: Number(draft.price),
                stockQuantity: Number(draft.stockQuantity),
            })
            setEditingId(null)
            load()
        } catch (err) {
            const data = err.response?.data
            setError(data?.fieldErrors ? Object.values(data.fieldErrors).join(' · ') : data?.message || 'Modification impossible.')
        }
    }

    const remove = async (offer) => {
        if (!window.confirm(`Supprimer votre offre sur « ${offer.productName} » ?`)) return
        try {
            await deleteOffer(offer.id)
            load()
        } catch (err) {
            setError(err.response?.data?.message || 'Suppression impossible.')
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-3xl font-bold text-ink">Mes produits</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-clay text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-clay-dark transition-colors"
                >
                    <Plus size={16} /> Nouveau produit
                </button>
            </div>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
                <div className="min-w-[640px]">
                    <div className="grid grid-cols-6 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="col-span-2">Produit</span>
                        <span>Catégorie</span>
                        <span>Prix</span>
                        <span>Stock</span>
                        <span className="text-right">Actions</span>
                    </div>

                    {loading && <p className="text-center text-ink-light py-10">Chargement...</p>}

                    {!loading && offers.length === 0 && (
                        <div className="text-center py-12">
                            <Package size={32} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-ink-light text-sm">Vous n'avez pas encore d'offre.</p>
                            <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm text-clay font-medium hover:underline">
                                Ajouter votre premier produit
                            </button>
                        </div>
                    )}

                    {offers.map((offer) => {
                        const product = productsById[offer.productId]
                        const editing = editingId === offer.id
                        return (
                            <div key={offer.id} className="grid grid-cols-6 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <div className="col-span-2 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                        {product?.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="text-sm font-medium text-ink truncate">{offer.productName}</span>
                                </div>
                                <span className="text-sm text-gray-400">{product?.category || '—'}</span>

                                {editing ? (
                                    <>
                                        <input type="number" min="0" step="0.01" value={draft.price}
                                               onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                                               className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
                                        <input type="number" min="0" value={draft.stockQuantity}
                                               onChange={(e) => setDraft({ ...draft, stockQuantity: e.target.value })}
                                               className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => saveEdit(offer)} className="text-green-500 hover:text-green-700"><Check size={16} /></button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm font-semibold text-ink">{offer.price} MAD</span>
                                        <span className="text-sm text-ink-light">{offer.stockQuantity}</span>
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => startEdit(offer)} className="text-gray-400 hover:text-clay"><Pencil size={15} /></button>
                                            <button onClick={() => remove(offer)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={load} />}
        </>
    )
}

// ─── Group Buying : MES sessions uniquement ──────────────────────────────────

export function VendorGroups() {
    const [offers, setOffers] = useState([])
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)

    const [editingSession, setEditingSession] = useState(null)
    const [actionError, setActionError] = useState('')

    useEffect(() => { loadAll() }, [])

    // Avant : les sessions étaient filtrées avec une liste d'offres encore vide,
    // puis le "fallback" affichait TOUTES les sessions de la plateforme.
    const loadAll = async () => {
        setLoading(true)
        try {
            const [myOffers, mySessions] = await Promise.all([getMyOffers(), getMySessions()])
            setOffers(myOffers)
            setSessions(mySessions)
        } catch {
            setSessions([])
        } finally {
            setLoading(false)
        }
    }

    const offerName = (id) => offers.find((o) => o.id === id)?.productName || `Offre #${id}`

    // Modifiable : session ACTIVE et sans participant (règle aussi appliquée par le backend)
    const canEdit = (s) => s.status === 'ACTIVE' && s.currentParticipants === 0
    // Supprimable / annulable : tout sauf une session déjà réussie
    const canDelete = (s) => s.status !== 'SUCCESSFUL'

    const handleDelete = async (session) => {
        const hasParticipants = session.currentParticipants > 0
        const message = hasParticipants
            ? `Annuler cette session ? Les ${session.currentParticipants} participant(s) seront remboursés (pré-autorisations libérées).`
            : 'Supprimer définitivement cette session ?'
        if (!window.confirm(message)) return

        setActionError('')
        try {
            await deleteSession(session.id)
            loadAll()
        } catch (err) {
            setActionError(err.response?.data?.message || 'Action impossible.')
        }
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

            {actionError && <p className="mb-4 text-sm text-red-500">{actionError}</p>}

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
                <div className="min-w-[720px]">
                    <div className="grid grid-cols-6 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="col-span-2">Produit / Offre</span>
                        <span>Participants</span>
                        <span>Prix groupé</span>
                        <span>Statut</span>
                        <span className="text-right">Actions</span>
                    </div>

                    {loading && <p className="text-center text-ink-light py-10">Chargement...</p>}

                    {!loading && sessions.length === 0 && (
                        <div className="text-center py-12">
                            <Users size={32} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-ink-light text-sm">Aucune session créée pour le moment.</p>
                            <button onClick={() => setShowAddModal(true)} className="mt-3 text-sm text-clay font-medium hover:underline">
                                Créer votre première session
                            </button>
                        </div>
                    )}

                    {sessions.map((session) => (
                        <div key={session.id} className="grid grid-cols-6 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-ink">{offerName(session.productOfferId)}</p>
                                <p className="text-xs text-ink-light">
                                    {session.status === 'ACTIVE'
                                        ? `${Math.floor(session.remainingSeconds / 3600)}h ${Math.floor((session.remainingSeconds % 3600) / 60)}min restantes`
                                        : 'Terminée'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-ink mb-1">{session.currentParticipants}/{session.targetParticipants}</p>
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-clay rounded-full"
                                         style={{ width: `${Math.min((session.currentParticipants / session.targetParticipants) * 100, 100)}%` }} />
                                </div>
                            </div>

                            <span className="text-sm font-bold text-clay">{session.groupPrice} MAD</span>

                            <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${STATUS_COLORS[session.status] || 'bg-gray-50 text-gray-500'}`}>
                                {STATUS_LABELS[session.status] || session.status}
                            </span>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setEditingSession(session)}
                                    disabled={!canEdit(session)}
                                    title={canEdit(session) ? 'Modifier' : 'Modifiable uniquement si la session est active et sans participant'}
                                    className="text-gray-400 hover:text-clay disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    <Pencil size={15} />
                                </button>
                                <button
                                    onClick={() => handleDelete(session)}
                                    disabled={!canDelete(session)}
                                    title={
                                        !canDelete(session) ? 'Une session réussie ne peut pas être supprimée'
                                            : session.currentParticipants > 0 ? 'Annuler (remboursement des participants)' : 'Supprimer'
                                    }
                                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAddModal && (
                <AddGroupModal offers={offers} onClose={() => setShowAddModal(false)} onSuccess={loadAll} />
            )}

            {editingSession && (
                <EditGroupModal
                    session={editingSession}
                    offers={offers}
                    onClose={() => setEditingSession(null)}
                    onSuccess={loadAll}
                />
            )}
        </>
    )
}