import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import {
    LayoutDashboard, Users, Package, ShoppingCart, Zap, Trash2, RefreshCw, Search,
    ChevronDown, ChevronUp, AlertTriangle, Ban, CheckCircle, X as XIcon,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getAllProducts } from '../api/catalogApi'
import { STATUS_LABELS, STATUS_COLORS, PAYMENT_LABELS, apiErrorMessage } from '../api/orderApi'
import {
    getAdminUsers, getUserStats, setUserEnabled, setUserRole,
    getCatalogStats, getAdminOffers, deleteAdminOffer, deleteProduct, reindexProducts,
    getAdminOrders, getOrderStats, setOrderItemStatus,
    getAdminSessions, getSessionStats, cancelAdminSession,
} from '../api/adminApi'

// ─── Constantes / helpers ────────────────────────────────────────────────────

const TABS = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'sales', label: 'Ventes', icon: ShoppingCart },
    { id: 'groups', label: 'Achats groupés', icon: Zap },
]

const COLORS = { clay: '#C98C82', gold: '#C99B50', sage: '#8C9A7B', rose: '#E8C9C5', blue: '#8FA8C8' }
const STATUS_CHART_COLORS = { ORDERED: '#8FA8C8', CONFIRMED: '#C99B50', SHIPPED: '#A98BC8', DELIVERED: '#8C9A7B' }
const tooltipStyle = { borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }
const axisTick = { fontSize: 11, fill: '#9ca3af' }

const ROLE_LABELS = { CLIENT: 'Client', VENDOR: 'Vendeur', ADMIN: 'Admin' }
const ROLE_COLORS = {
    CLIENT: 'bg-blue-50 text-blue-600',
    VENDOR: 'bg-yellow-50 text-yellow-700',
    ADMIN: 'bg-purple-50 text-purple-600',
}
const SESSION_LABELS = { ACTIVE: 'En cours', SUCCESSFUL: 'Réussie', FAILED: 'Échouée' }
const SESSION_COLORS = {
    ACTIVE: 'bg-blue-50 text-blue-600',
    SUCCESSFUL: 'bg-green-50 text-green-600',
    FAILED: 'bg-red-50 text-red-500',
}

const fmtMoney = (n) =>
    `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MAD`
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

/** Charge des données au montage ; reload() relance l'appel. */
function useLoader(loader) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            setData(await loader())
        } catch (err) {
            setError(apiErrorMessage(err, 'Chargement impossible.'))
        } finally {
            setLoading(false)
        }
    }, [loader])

    useEffect(() => { load() }, [load])
    return { data, setData, loading, error, reload: load }
}

// ─── Petits composants ───────────────────────────────────────────────────────

const Card = ({ title, action, children, className = '' }) => (
    <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ${className}`}>
        {(title || action) && (
            <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-ink">{title}</h2>
                {action}
            </div>
        )}
        {children}
    </div>
)

const Kpi = ({ label, value, hint }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="font-bold text-2xl text-ink">{value}</p>
        {hint && <p className="text-xs text-ink-light mt-1">{hint}</p>}
    </div>
)

const ErrorBanner = ({ message, onClose }) =>
    message ? (
        <div className="mb-4 flex items-start justify-between gap-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            <span>{message}</span>
            {onClose && (
                <button onClick={onClose} className="shrink-0 text-red-400 hover:text-red-600"><XIcon size={14} /></button>
            )}
        </div>
    ) : null

const Loading = () => <p className="text-center text-ink-light py-12 text-sm">Chargement...</p>
const Empty = ({ children }) => <p className="text-center text-ink-light py-10 text-sm">{children}</p>

const Badge = ({ className, children }) => (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${className}`}>{children}</span>
)

const inputCls = 'px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay bg-white'

const SearchInput = ({ value, onChange, placeholder }) => (
    <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${inputCls} pl-9 w-64`}
        />
    </div>
)

const TableShell = ({ minWidth = 760, children }) => (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <div style={{ minWidth }}>{children}</div>
    </div>
)

const THead = ({ cols, children }) => (
    <div className={`grid ${cols} text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100`}>
        {children}
    </div>
)

const Row = ({ cols, children, className = '' }) => (
    <div className={`grid ${cols} items-center px-6 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${className}`}>
        {children}
    </div>
)

// ─── 1. Vue d'ensemble ───────────────────────────────────────────────────────

function OverviewTab({ goTo }) {
    const loader = useCallback(async () => {
        const [orders, users, catalog, groups, recent] = await Promise.allSettled([
            getOrderStats(), getUserStats(), getCatalogStats(), getSessionStats(), getAdminOrders(),
        ])
        return {
            orders: orders.status === 'fulfilled' ? orders.value : null,
            users: users.status === 'fulfilled' ? users.value : null,
            catalog: catalog.status === 'fulfilled' ? catalog.value : null,
            groups: groups.status === 'fulfilled' ? groups.value : null,
            recent: recent.status === 'fulfilled' ? recent.value.slice(0, 6) : [],
            failed: [
                orders.status === 'rejected' && 'ventes',
                users.status === 'rejected' && 'utilisateurs',
                catalog.status === 'rejected' && 'catalogue',
                groups.status === 'rejected' && 'achats groupés',
            ].filter(Boolean),
        }
    }, [])
    const { data, loading, error, reload } = useLoader(loader)

    if (loading) return <Loading />
    if (error) return <ErrorBanner message={error} />
    const { orders, users, catalog, groups, recent, failed } = data

    const statusData = orders
        ? Object.entries(orders.statusCounts).map(([k, v]) => ({ key: k, name: STATUS_LABELS[k], value: v }))
        : []

    return (
        <div className="space-y-6">
            {failed.length > 0 && (
                <ErrorBanner message={`Données indisponibles pour : ${failed.join(', ')}. Vérifiez que le service correspondant est démarré.`} />
            )}

            <div className="flex justify-end">
                <button onClick={reload} className="flex items-center gap-1.5 text-xs text-ink-light hover:text-clay">
                    <RefreshCw size={13} /> Actualiser
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label="Revenu total" value={orders ? fmtMoney(orders.totalRevenue) : '—'} hint="depuis le début" />
                <Kpi label="Revenu (30 jours)" value={orders ? fmtMoney(orders.revenueLast30Days) : '—'} />
                <Kpi label="Commandes" value={orders ? orders.ordersCount : '—'}
                     hint={orders ? `${orders.itemsSold} article(s) vendu(s)` : undefined} />
                <Kpi label="Panier moyen" value={orders ? fmtMoney(orders.averageBasket) : '—'}
                     hint={orders ? `${orders.uniqueClients} client(s) acheteur(s)` : undefined} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label="Utilisateurs" value={users ? users.totalUsers : '—'}
                     hint={users ? `+${users.newUsersLast7Days} cette semaine` : undefined} />
                <Kpi label="Vendeurs" value={users ? users.vendors : '—'}
                     hint={users ? `${users.clients} client(s)` : undefined} />
                <Kpi label="Produits" value={catalog ? catalog.productsCount : '—'}
                     hint={catalog ? `${catalog.offersCount} offre(s)` : undefined} />
                <Kpi label="Groupes actifs" value={groups ? groups.activeSessions : '—'}
                     hint={groups ? `taux de succès ${groups.successRatePercent}%` : undefined} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Revenus (30 derniers jours)">
                    {orders ? (
                        <ResponsiveContainer width="100%" height={230}>
                            <LineChart data={orders.revenueByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} interval={4} />
                                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} MAD`, 'Revenus']} />
                                <Line type="monotone" dataKey="revenue" stroke={COLORS.clay} strokeWidth={2.5} dot={false}
                                      activeDot={{ r: 5, fill: COLORS.clay }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <Empty>Indisponible</Empty>}
                </Card>

                <Card title="Nouvelles inscriptions (30 jours)">
                    {users ? (
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={users.signupsByDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} interval={4} />
                                <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Inscriptions']} />
                                <Bar dataKey="count" fill={COLORS.sage} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty>Indisponible</Empty>}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Top produits (quantités)">
                    {orders && orders.topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={210}>
                            <BarChart data={orders.topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#6b7280' }}
                                       axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Ventes']} />
                                <Bar dataKey="sales" fill={COLORS.gold} radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty>Aucune vente.</Empty>}
                </Card>

                <Card title="Statut des articles vendus">
                    {orders && statusData.some((s) => s.value > 0) ? (
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width={140} height={140}>
                                <PieChart>
                                    <Pie data={statusData} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={3}>
                                        {statusData.map((s) => <Cell key={s.key} fill={STATUS_CHART_COLORS[s.key]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {statusData.map((s) => (
                                    <div key={s.key} className="flex items-center gap-2 text-xs">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_CHART_COLORS[s.key] }} />
                                        <span className="text-ink">{s.name}</span>
                                        <span className="font-bold text-ink ml-auto pl-3">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <Empty>Aucune vente.</Empty>}
                </Card>

                <Card title="Top vendeurs (chiffre d'affaires)">
                    {orders && orders.topVendors.length > 0 ? (
                        <div className="space-y-3">
                            {orders.topVendors.map((v, i) => (
                                <div key={v.vendorEmail} className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-clay/10 text-clay text-xs font-bold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-ink truncate">{v.vendorEmail}</p>
                                        <p className="text-xs text-ink-light">{v.itemsSold} article(s)</p>
                                    </div>
                                    <span className="text-sm font-semibold text-clay">{fmtMoney(v.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    ) : <Empty>Aucune vente.</Empty>}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Alertes de stock"
                      action={catalog && <span className="text-xs text-ink-light">seuil : 5 unités</span>}>
                    {catalog && catalog.lowStock.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {catalog.lowStock.map((o) => (
                                <div key={o.offerId} className="flex items-center gap-3 text-sm">
                                    <AlertTriangle size={15} className={o.stockQuantity === 0 ? 'text-red-400' : 'text-yellow-500'} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-ink truncate">{o.productName}</p>
                                        <p className="text-xs text-ink-light truncate">{o.vendorEmail}</p>
                                    </div>
                                    <Badge className={o.stockQuantity === 0 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-700'}>
                                        {o.stockQuantity === 0 ? 'Rupture' : `${o.stockQuantity} restant(s)`}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : <Empty>Aucun stock critique.</Empty>}
                </Card>

                <Card title="Dernières commandes"
                      action={<button onClick={() => goTo('sales')} className="text-xs text-clay hover:underline">Tout voir →</button>}>
                    {recent.length > 0 ? (
                        <div className="space-y-2">
                            {recent.map((o) => (
                                <div key={o.id} className="flex items-center gap-3 text-sm">
                                    <span className="font-semibold text-ink w-24 shrink-0">{o.orderNumber}</span>
                                    <span className="text-ink-light truncate flex-1">{o.clientEmail}</span>
                                    <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                                    <span className="font-semibold text-ink w-24 text-right shrink-0">{fmtMoney(o.total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : <Empty>Aucune commande.</Empty>}
                </Card>
            </div>
        </div>
    )
}

// ─── 2. Utilisateurs ─────────────────────────────────────────────────────────

function UsersTab() {
    const myEmail = useAuthStore((s) => s.email)
    const loader = useCallback(async () => {
        const [users, stats] = await Promise.all([getAdminUsers(), getUserStats()])
        return { users, stats }
    }, [])
    const { data, setData, loading, error } = useLoader(loader)

    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [actionError, setActionError] = useState('')
    const [busyId, setBusyId] = useState(null)

    const replaceUser = (updated) =>
        setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === updated.id ? updated : u)) }))

    const toggleEnabled = async (user) => {
        const verb = user.enabled ? 'désactiver' : 'réactiver'
        if (!window.confirm(`Voulez-vous ${verb} le compte de ${user.fullName} ?`)) return
        setBusyId(user.id); setActionError('')
        try { replaceUser(await setUserEnabled(user.id, !user.enabled)) }
        catch (err) { setActionError(apiErrorMessage(err, 'Action impossible.')) }
        finally { setBusyId(null) }
    }

    const changeRole = async (user, role) => {
        if (role === user.role) return
        if (!window.confirm(`Changer le rôle de ${user.fullName} en « ${ROLE_LABELS[role]} » ?`)) return
        setBusyId(user.id); setActionError('')
        try { replaceUser(await setUserRole(user.id, role)) }
        catch (err) { setActionError(apiErrorMessage(err, 'Action impossible.')) }
        finally { setBusyId(null) }
    }

    const filtered = useMemo(() => {
        if (!data) return []
        const q = search.trim().toLowerCase()
        return data.users.filter((u) =>
            (roleFilter === 'ALL' || u.role === roleFilter) &&
            (statusFilter === 'ALL' || (statusFilter === 'ACTIVE') === u.enabled) &&
            (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
    }, [data, search, roleFilter, statusFilter])

    if (loading) return <Loading />
    if (error) return <ErrorBanner message={error} />
    const { stats } = data

    return (
        <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Kpi label="Total" value={stats.totalUsers} hint={`+${stats.newUsersLast7Days} sur 7 jours`} />
                <Kpi label="Clients" value={stats.clients} />
                <Kpi label="Vendeurs" value={stats.vendors} />
                <Kpi label="Comptes désactivés" value={stats.disabledUsers} hint={`${stats.admins} admin(s)`} />
            </div>

            <ErrorBanner message={actionError} onClose={() => setActionError('')} />

            <div className="flex flex-wrap gap-3 mb-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Rechercher nom ou email..." />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputCls}>
                    <option value="ALL">Tous les rôles</option>
                    <option value="CLIENT">Clients</option>
                    <option value="VENDOR">Vendeurs</option>
                    <option value="ADMIN">Admins</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
                    <option value="ALL">Tous les statuts</option>
                    <option value="ACTIVE">Actifs</option>
                    <option value="DISABLED">Désactivés</option>
                </select>
            </div>

            <TableShell minWidth={860}>
                <THead cols="grid-cols-12">
                    <span className="col-span-3">Nom</span>
                    <span className="col-span-3">Email</span>
                    <span className="col-span-2">Rôle</span>
                    <span className="col-span-1">Inscrit</span>
                    <span className="col-span-1">Statut</span>
                    <span className="col-span-2 text-right">Action</span>
                </THead>
                {filtered.length === 0 && <Empty>Aucun utilisateur.</Empty>}
                {filtered.map((u) => {
                    const isMe = u.email === myEmail
                    return (
                        <Row key={u.id} cols="grid-cols-12">
                            <span className="col-span-3 text-sm font-medium text-ink truncate pr-2">
                                {u.fullName}{isMe && <span className="text-xs text-clay"> (vous)</span>}
                            </span>
                            <span className="col-span-3 text-sm text-ink-light truncate pr-2">{u.email}</span>
                            <div className="col-span-2">
                                <select
                                    value={u.role}
                                    disabled={isMe || busyId === u.id}
                                    onChange={(e) => changeRole(u, e.target.value)}
                                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none ${ROLE_COLORS[u.role]} disabled:opacity-60`}
                                >
                                    {Object.entries(ROLE_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                </select>
                            </div>
                            <span className="col-span-1 text-xs text-ink-light">{fmtDate(u.createdAt)}</span>
                            <div className="col-span-1">
                                <Badge className={u.enabled ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}>
                                    {u.enabled ? 'Actif' : 'Désactivé'}
                                </Badge>
                            </div>
                            <div className="col-span-2 text-right">
                                <button
                                    onClick={() => toggleEnabled(u)}
                                    disabled={isMe || busyId === u.id}
                                    title={isMe ? 'Vous ne pouvez pas modifier votre propre compte' : undefined}
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                        u.enabled
                                            ? 'border-red-200 text-red-500 hover:bg-red-50'
                                            : 'border-green-200 text-green-600 hover:bg-green-50'
                                    }`}
                                >
                                    {u.enabled ? <><Ban size={12} /> Désactiver</> : <><CheckCircle size={12} /> Réactiver</>}
                                </button>
                            </div>
                        </Row>
                    )
                })}
            </TableShell>
            <p className="text-xs text-ink-light mt-3">
                Un compte désactivé ne peut plus se connecter. Les sessions déjà ouvertes expirent avec leur token.
            </p>
        </div>
    )
}

// ─── 3. Produits ─────────────────────────────────────────────────────────────

function ProductsTab() {
    const loader = useCallback(async () => {
        const [products, offers, stats] = await Promise.all([getAllProducts(), getAdminOffers(), getCatalogStats()])
        return { products, offers, stats }
    }, [])
    const { data, setData, loading, error, reload } = useLoader(loader)

    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('ALL')
    const [actionError, setActionError] = useState('')
    const [info, setInfo] = useState('')
    const [busy, setBusy] = useState(false)

    const categories = useMemo(
        () => (data ? [...new Set(data.products.map((p) => p.category))].sort() : []),
        [data])

    const filtered = useMemo(() => {
        if (!data) return []
        const q = search.trim().toLowerCase()
        return data.products.filter((p) =>
            (category === 'ALL' || p.category === category) &&
            (!q || p.name.toLowerCase().includes(q)))
    }, [data, search, category])

    const handleDeleteProduct = async (p) => {
        if (!window.confirm(`Supprimer « ${p.name} » et toutes ses offres ? Cette action est définitive.`)) return
        setBusy(true); setActionError(''); setInfo('')
        try { await deleteProduct(p.id); await reload() }
        catch (err) { setActionError(apiErrorMessage(err, 'Suppression impossible.')) }
        finally { setBusy(false) }
    }

    const handleDeleteOffer = async (o) => {
        if (!window.confirm(`Supprimer l'offre de ${o.vendorEmail} pour « ${o.productName} » ?`)) return
        setBusy(true); setActionError(''); setInfo('')
        try {
            await deleteAdminOffer(o.id)
            setData((prev) => ({ ...prev, offers: prev.offers.filter((x) => x.id !== o.id) }))
        } catch (err) { setActionError(apiErrorMessage(err, 'Suppression impossible.')) }
        finally { setBusy(false) }
    }

    const handleReindex = async () => {
        setActionError(''); setInfo('')
        try { await reindexProducts(); setInfo("Réindexation lancée : l'assistant IA connaîtra tous les produits dans quelques instants.") }
        catch (err) { setActionError(apiErrorMessage(err, 'Réindexation impossible.')) }
    }

    if (loading) return <Loading />
    if (error) return <ErrorBanner message={error} />
    const { stats, offers } = data

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi label="Produits" value={stats.productsCount} hint={`${stats.productsWithoutOffer} sans offre`} />
                <Kpi label="Offres" value={stats.offersCount} hint={`${stats.vendorsCount} vendeur(s)`} />
                <Kpi label="Unités en stock" value={stats.totalStockUnits} />
                <Kpi label="Valeur du stock" value={fmtMoney(stats.inventoryValue)} />
            </div>

            <ErrorBanner message={actionError} onClose={() => setActionError('')} />
            {info && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-2">{info}</p>}

            <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un produit..." />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                        <option value="ALL">Toutes catégories</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={handleReindex}
                            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-clay text-clay hover:bg-clay hover:text-white transition-colors">
                        <RefreshCw size={13} /> Réindexer l'assistant IA
                    </button>
                </div>

                <TableShell minWidth={760}>
                    <THead cols="grid-cols-12">
                        <span className="col-span-5">Produit</span>
                        <span className="col-span-2">Catégorie</span>
                        <span className="col-span-2">Prix min.</span>
                        <span className="col-span-2">Créé le</span>
                        <span className="col-span-1 text-right">Action</span>
                    </THead>
                    {filtered.length === 0 && <Empty>Aucun produit.</Empty>}
                    {filtered.map((p) => (
                        <Row key={p.id} cols="grid-cols-12">
                            <div className="col-span-5 flex items-center gap-3 min-w-0 pr-2">
                                <div className="w-11 h-11 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                                    {p.imageUrl
                                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-300">Pas d'image</div>}
                                </div>
                                <span className="text-sm font-medium text-ink truncate">{p.name}</span>
                            </div>
                            <span className="col-span-2 text-sm text-ink-light truncate">{p.category}</span>
                            <span className="col-span-2 text-sm font-semibold text-clay">
                                {p.lowestPrice ? fmtMoney(p.lowestPrice) : <span className="text-gray-300 font-normal">Sans offre</span>}
                            </span>
                            <span className="col-span-2 text-xs text-ink-light">{fmtDate(p.createdAt)}</span>
                            <div className="col-span-1 text-right">
                                <button onClick={() => handleDeleteProduct(p)} disabled={busy}
                                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                        title="Supprimer le produit">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </Row>
                    ))}
                </TableShell>
            </div>

            <div>
                <h2 className="font-semibold text-ink mb-3">Offres des vendeurs</h2>
                <TableShell minWidth={760}>
                    <THead cols="grid-cols-12">
                        <span className="col-span-4">Produit</span>
                        <span className="col-span-3">Vendeur</span>
                        <span className="col-span-2">Prix</span>
                        <span className="col-span-2">Stock</span>
                        <span className="col-span-1 text-right">Action</span>
                    </THead>
                    {offers.length === 0 && <Empty>Aucune offre.</Empty>}
                    {offers.map((o) => (
                        <Row key={o.id} cols="grid-cols-12">
                            <span className="col-span-4 text-sm text-ink truncate pr-2">{o.productName}</span>
                            <span className="col-span-3 text-sm text-ink-light truncate pr-2">{o.vendorEmail}</span>
                            <span className="col-span-2 text-sm font-semibold text-clay">{fmtMoney(o.price)}</span>
                            <div className="col-span-2">
                                <Badge className={
                                    o.stockQuantity === 0 ? 'bg-red-50 text-red-500'
                                        : o.stockQuantity <= 5 ? 'bg-yellow-50 text-yellow-700'
                                            : 'bg-green-50 text-green-600'}>
                                    {o.stockQuantity === 0 ? 'Rupture' : `${o.stockQuantity} unité(s)`}
                                </Badge>
                            </div>
                            <div className="col-span-1 text-right">
                                <button onClick={() => handleDeleteOffer(o)} disabled={busy}
                                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                        title="Supprimer l'offre">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </Row>
                    ))}
                </TableShell>
            </div>
        </div>
    )
}

// ─── 4. Ventes ───────────────────────────────────────────────────────────────

const ORDER_FILTERS = ['ALL', 'ORDERED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

function SalesTab() {
    const loader = useCallback(async () => {
        const [orders, stats] = await Promise.all([getAdminOrders(), getOrderStats()])
        return { orders, stats }
    }, [])
    const { data, setData, loading, error } = useLoader(loader)

    const [filter, setFilter] = useState('ALL')
    const [search, setSearch] = useState('')
    const [openId, setOpenId] = useState(null)
    const [actionError, setActionError] = useState('')
    const [busyItem, setBusyItem] = useState(null)

    const filtered = useMemo(() => {
        if (!data) return []
        const q = search.trim().toLowerCase()
        return data.orders.filter((o) =>
            (filter === 'ALL' || o.status === filter) &&
            (!q || o.orderNumber.toLowerCase().includes(q) || o.clientEmail.toLowerCase().includes(q)
                || o.clientName.toLowerCase().includes(q)))
    }, [data, filter, search])

    const changeItemStatus = async (itemId, status) => {
        setBusyItem(itemId); setActionError('')
        try {
            const updated = await setOrderItemStatus(itemId, status)
            setData((prev) => ({ ...prev, orders: prev.orders.map((o) => (o.id === updated.id ? updated : o)) }))
        } catch (err) { setActionError(apiErrorMessage(err, 'Mise à jour impossible.')) }
        finally { setBusyItem(null) }
    }

    if (loading) return <Loading />
    if (error) return <ErrorBanner message={error} />
    const { stats } = data

    return (
        <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Kpi label="Revenu total" value={fmtMoney(stats.totalRevenue)} />
                <Kpi label="Commandes" value={stats.ordersCount} hint={`${stats.itemsSold} article(s)`} />
                <Kpi label="Panier moyen" value={fmtMoney(stats.averageBasket)} />
                <Kpi label="Paiement" value={`${stats.paymentCounts.DELIVERY ?? 0} / ${stats.paymentCounts.CARD ?? 0}`}
                     hint="livraison / carte" />
            </div>

            <ErrorBanner message={actionError} onClose={() => setActionError('')} />

            <div className="flex flex-wrap items-center gap-2 mb-4">
                {ORDER_FILTERS.map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                filter === f ? 'bg-clay text-white border-clay' : 'bg-white text-ink border-gray-200 hover:border-clay'}`}>
                        {f === 'ALL' ? 'Tout' : STATUS_LABELS[f]}
                    </button>
                ))}
                <div className="ml-auto">
                    <SearchInput value={search} onChange={setSearch} placeholder="N° commande, client..." />
                </div>
            </div>

            <TableShell minWidth={860}>
                <THead cols="grid-cols-12">
                    <span className="col-span-2">Commande</span>
                    <span className="col-span-3">Client</span>
                    <span className="col-span-2">Date</span>
                    <span className="col-span-2">Total</span>
                    <span className="col-span-2">Statut</span>
                    <span className="col-span-1" />
                </THead>
                {filtered.length === 0 && <Empty>Aucune commande.</Empty>}
                {filtered.map((o) => {
                    const open = openId === o.id
                    return (
                        <div key={o.id} className="border-b border-gray-50 last:border-0">
                            <Row cols="grid-cols-12" className="cursor-pointer">
                                <span className="col-span-2 text-sm font-semibold text-ink"
                                      onClick={() => setOpenId(open ? null : o.id)}>{o.orderNumber}</span>
                                <div className="col-span-3 min-w-0 pr-2" onClick={() => setOpenId(open ? null : o.id)}>
                                    <p className="text-sm text-ink truncate">{o.clientName}</p>
                                    <p className="text-xs text-ink-light truncate">{o.clientEmail}</p>
                                </div>
                                <span className="col-span-2 text-xs text-ink-light"
                                      onClick={() => setOpenId(open ? null : o.id)}>{fmtDateTime(o.createdAt)}</span>
                                <span className="col-span-2 text-sm font-bold text-clay"
                                      onClick={() => setOpenId(open ? null : o.id)}>{fmtMoney(o.total)}</span>
                                <div className="col-span-2" onClick={() => setOpenId(open ? null : o.id)}>
                                    <Badge className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                                </div>
                                <button className="col-span-1 flex justify-end text-gray-400"
                                        onClick={() => setOpenId(open ? null : o.id)}>
                                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </Row>

                            {open && (
                                <div className="bg-gray-50/70 px-6 py-4 space-y-3">
                                    <p className="text-xs text-ink-light">
                                        {o.city} · {o.phone} · {PAYMENT_LABELS[o.paymentMethod]}
                                    </p>
                                    {o.items.map((item) => (
                                        <div key={item.id} className="flex flex-wrap items-center gap-3 text-sm">
                                            <span className="text-ink flex-1 min-w-[160px]">
                                                {item.productName} × {item.quantity}
                                                <span className="block text-xs text-ink-light">Vendeur : {item.vendorEmail}</span>
                                            </span>
                                            <span className="text-ink font-medium">{fmtMoney(item.lineTotal)}</span>
                                            <select
                                                value={item.status}
                                                disabled={busyItem === item.id}
                                                onChange={(e) => changeItemStatus(item.id, e.target.value)}
                                                className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none ${STATUS_COLORS[item.status]}`}
                                            >
                                                {Object.entries(STATUS_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </TableShell>
        </div>
    )
}

// ─── 5. Achats groupés ───────────────────────────────────────────────────────

function GroupsTab() {
    const loader = useCallback(async () => {
        const [sessions, stats, offers] = await Promise.all([
            getAdminSessions(), getSessionStats(), getAdminOffers().catch(() => []),
        ])
        return { sessions, stats, offers }
    }, [])
    const { data, reload, loading, error } = useLoader(loader)

    const [filter, setFilter] = useState('ALL')
    const [actionError, setActionError] = useState('')
    const [busyId, setBusyId] = useState(null)

    const offerNames = useMemo(() => {
        const map = {}
        data?.offers.forEach((o) => { map[o.id] = o.productName })
        return map
    }, [data])

    const handleCancel = async (s) => {
        if (!window.confirm(`Annuler cette session ? Les ${s.currentParticipants} participant(s) seront remboursés.`)) return
        setBusyId(s.id); setActionError('')
        try { await cancelAdminSession(s.id); await reload() }
        catch (err) { setActionError(apiErrorMessage(err, 'Annulation impossible.')) }
        finally { setBusyId(null) }
    }

    if (loading) return <Loading />
    if (error) return <ErrorBanner message={error} />
    const { stats, sessions } = data
    const filtered = filter === 'ALL' ? sessions : sessions.filter((s) => s.status === filter)

    const pieData = [
        { name: 'Réussies', value: stats.successfulSessions, color: COLORS.sage },
        { name: 'Échouées', value: stats.failedSessions, color: COLORS.rose },
        { name: 'En cours', value: stats.activeSessions, color: COLORS.clay },
    ]

    return (
        <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Kpi label="Sessions" value={stats.totalSessions} hint={`${stats.activeSessions} en cours`} />
                <Kpi label="Taux de succès" value={`${stats.successRatePercent}%`}
                     hint={`${stats.successfulSessions} réussie(s) / ${stats.failedSessions} échouée(s)`} />
                <Kpi label="Participations" value={stats.totalParticipations} />
                <Kpi label="Paiements capturés" value={stats.participationsByPaymentStatus.CAPTURED ?? 0}
                     hint={`${stats.participationsByPaymentStatus.RELEASED ?? 0} libérés`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card title="Répartition des sessions">
                    {stats.totalSessions > 0 ? (
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width={130} height={130}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" innerRadius={38} outerRadius={60} paddingAngle={3}>
                                        {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {pieData.map((e) => (
                                    <div key={e.name} className="flex items-center gap-2 text-xs">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                                        <span className="text-ink">{e.name}</span>
                                        <span className="font-bold text-ink ml-auto pl-3">{e.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <Empty>Aucune session.</Empty>}
                </Card>
                <div className="lg:col-span-2 flex items-end">
                    <p className="text-xs text-ink-light">
                        Une session réussie capture les paiements pré-autorisés de tous les participants ; une session
                        échouée ou annulée les libère (remboursement). L'annulation par l'administrateur n'est possible
                        que sur une session en cours.
                    </p>
                </div>
            </div>

            <ErrorBanner message={actionError} onClose={() => setActionError('')} />

            <div className="flex flex-wrap gap-2 mb-4">
                {['ALL', 'ACTIVE', 'SUCCESSFUL', 'FAILED'].map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                filter === f ? 'bg-clay text-white border-clay' : 'bg-white text-ink border-gray-200 hover:border-clay'}`}>
                        {f === 'ALL' ? 'Tout' : SESSION_LABELS[f]}
                    </button>
                ))}
            </div>

            <TableShell minWidth={900}>
                <THead cols="grid-cols-12">
                    <span className="col-span-3">Produit / Vendeur</span>
                    <span className="col-span-2">Participants</span>
                    <span className="col-span-2">Prix groupé</span>
                    <span className="col-span-2">Fin</span>
                    <span className="col-span-2">Statut</span>
                    <span className="col-span-1 text-right">Action</span>
                </THead>
                {filtered.length === 0 && <Empty>Aucune session.</Empty>}
                {filtered.map((s) => {
                    const pct = Math.min(100, Math.round((s.currentParticipants / s.targetParticipants) * 100))
                    return (
                        <Row key={s.id} cols="grid-cols-12">
                            <div className="col-span-3 min-w-0 pr-2">
                                <p className="text-sm font-medium text-ink truncate">
                                    {offerNames[s.productOfferId] || `Offre #${s.productOfferId}`}
                                </p>
                                <p className="text-xs text-ink-light truncate">{s.vendorEmail}</p>
                            </div>
                            <div className="col-span-2 pr-3">
                                <p className="text-xs text-ink mb-1">{s.currentParticipants} / {s.targetParticipants}</p>
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-clay" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                            <span className="col-span-2 text-sm font-semibold text-clay">{fmtMoney(s.groupPrice)}</span>
                            <span className="col-span-2 text-xs text-ink-light">{fmtDateTime(s.endTime)}</span>
                            <div className="col-span-2"><Badge className={SESSION_COLORS[s.status]}>{SESSION_LABELS[s.status]}</Badge></div>
                            <div className="col-span-1 text-right">
                                {s.status === 'ACTIVE' ? (
                                    <button onClick={() => handleCancel(s)} disabled={busyId === s.id}
                                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40">
                                        Annuler
                                    </button>
                                ) : <span className="text-xs text-gray-300">—</span>}
                            </div>
                        </Row>
                    )
                })}
            </TableShell>
        </div>
    )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [tab, setTab] = useState('overview')

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-1">Administration</h1>
            <p className="text-ink-light text-sm mb-6">Supervision de la plateforme ShopOra</p>

            <div className="flex gap-1 sm:gap-6 border-b border-gray-100 mb-8 overflow-x-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                            tab === id ? 'text-clay border-clay' : 'text-ink-light border-transparent hover:text-ink'
                        }`}
                    >
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {tab === 'overview' && <OverviewTab goTo={setTab} />}
            {tab === 'users' && <UsersTab />}
            {tab === 'products' && <ProductsTab />}
            {tab === 'sales' && <SalesTab />}
            {tab === 'groups' && <GroupsTab />}
        </div>
    )
}
