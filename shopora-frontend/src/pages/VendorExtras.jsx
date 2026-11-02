import { useEffect, useState } from 'react'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getVendorOrders, getVendorStats, updateItemStatus, STATUS_LABELS, STATUS_COLORS, NEXT_STATUS, apiErrorMessage } from '../api/orderApi'
import { getMySessions } from '../api/groupBuyingApi'

const tooltipStyle = { borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }
const axisTick = { fontSize: 11, fill: '#9ca3af' }

const ErrorBanner = ({ message }) =>
    message ? (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{message}</p>
    ) : null

const fmtMoney = (n) => `${Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MAD`

// ─── Commandes ────────────────────────────────────────────────────────────────

const FILTERS = ['ALL', 'ORDERED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']
const NEXT_ACTION_LABELS = { CONFIRMED: 'Confirmer', SHIPPED: 'Marquer expédié', DELIVERED: 'Marquer livré' }

export function VendorOrders() {
    const [orders, setOrders] = useState([])
    const [filter, setFilter] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState(null)

    useEffect(() => {
        let cancelled = false
        getVendorOrders()
            .then((data) => { if (!cancelled) setOrders(data) })
            .catch((err) => { if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger les commandes.')) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

    const handleAdvance = async (order) => {
        const next = NEXT_STATUS[order.status]
        if (!next || busyId) return
        setBusyId(order.itemId)
        setError('')
        try {
            const updated = await updateItemStatus(order.itemId, next)
            setOrders((prev) => prev.map((o) => (o.itemId === updated.itemId ? updated : o)))
        } catch (err) {
            setError(apiErrorMessage(err, 'Mise à jour impossible.'))
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-3xl font-bold text-ink">Commandes</h1>
                <p className="text-ink-light text-sm mt-1">{loading ? '...' : `${filtered.length} commande(s)`}</p>
            </div>
            <ErrorBanner message={error} />

            <div className="flex gap-2 flex-wrap mb-6">
                {FILTERS.map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                filter === f ? 'bg-clay text-white border-clay' : 'bg-white text-ink border-gray-200 hover:border-clay'
                            }`}>
                        {f === 'ALL' ? 'Tout' : STATUS_LABELS[f]}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
                <div className="min-w-[860px]">
                    <div className="grid grid-cols-7 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 bg-gray-50 border-b border-gray-100">
                        <span>Commande</span>
                        <span className="col-span-2">Produit / Client</span>
                        <span>Date</span>
                        <span>Montant</span>
                        <span>Statut</span>
                        <span>Action</span>
                    </div>

                    {loading && <p className="text-center text-ink-light py-12">Chargement...</p>}
                    {!loading && filtered.length === 0 && <p className="text-center text-ink-light py-12">Aucune commande.</p>}

                    {filtered.map((order) => {
                        const next = NEXT_STATUS[order.status]
                        return (
                            <div key={order.itemId} className="grid grid-cols-7 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                <p className="text-sm font-semibold text-ink">{order.orderNumber}</p>
                                <div className="col-span-2 pr-2">
                                    <p className="text-sm font-medium text-ink truncate">
                                        {order.productName} × {order.quantity}
                                    </p>
                                    <p className="text-xs text-ink-light truncate">{order.clientName} · {order.city}</p>
                                    <p className="text-xs text-ink-light truncate">{order.phone}</p>
                                </div>
                                <span className="text-sm text-ink-light">
                                    {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="text-sm font-bold text-clay">{fmtMoney(order.amount)}</span>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${STATUS_COLORS[order.status]}`}>
                                    {STATUS_LABELS[order.status]}
                                </span>
                                <div>
                                    {next ? (
                                        <button
                                            onClick={() => handleAdvance(order)}
                                            disabled={busyId === order.itemId}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-clay text-clay hover:bg-clay hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            {busyId === order.itemId ? '...' : NEXT_ACTION_LABELS[next]}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-300">—</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── Statistiques ─────────────────────────────────────────────────────────────

export function VendorStats() {
    const [stats, setStats] = useState(null)
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        Promise.all([getVendorStats(), getMySessions().catch(() => [])])
            .then(([s, sess]) => {
                if (cancelled) return
                setStats(s)
                setSessions(sess)
            })
            .catch((err) => { if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger les statistiques.')) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    // Taux de succès des achats groupés : calculé à partir des vraies sessions du vendeur
    const successCount = sessions.filter((s) => s.status === 'SUCCESSFUL').length
    const failedCount = sessions.filter((s) => s.status === 'FAILED').length
    const activeCount = sessions.filter((s) => s.status === 'ACTIVE').length
    const finished = successCount + failedCount
    const successRate = finished === 0 ? '—' : `${Math.round((successCount / finished) * 100)}%`

    const groupData = [
        { name: 'Réussies', value: successCount, color: '#8C9A7B' },
        { name: 'Échouées', value: failedCount, color: '#E8C9C5' },
        { name: 'En cours', value: activeCount, color: '#C98C82' },
    ]

    const kpis = stats ? [
        { label: 'Revenu total (30j)', value: fmtMoney(stats.totalRevenue) },
        { label: 'Commandes', value: String(stats.ordersCount) },
        { label: 'Panier moyen', value: fmtMoney(stats.averageBasket) },
        { label: 'Taux succès groupes', value: successRate },
    ] : []

    return (
        <div>
            <h1 className="font-display text-3xl font-bold text-ink mb-1">Statistiques</h1>
            <p className="text-ink-light text-sm mb-6">30 derniers jours</p>
            <ErrorBanner message={error} />

            {loading && <p className="text-center text-ink-light py-12">Chargement...</p>}

            {stats && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {kpis.map(({ label, value }) => (
                            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <p className="text-xs text-gray-400 mb-1">{label}</p>
                                <p className="font-bold text-2xl text-ink">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-semibold text-ink mb-5">Revenus (30 derniers jours)</h2>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={stats.revenueByDay}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} interval={4} />
                                    <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} MAD`, 'Revenus']} />
                                    <Line type="monotone" dataKey="revenue" stroke="#C98C82" strokeWidth={2.5} dot={false}
                                          activeDot={{ r: 5, fill: '#C98C82' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="font-semibold text-ink mb-5">Top produits (quantités vendues)</h2>
                            {stats.topProducts.length === 0 ? (
                                <p className="text-sm text-ink-light py-16 text-center">Aucune vente sur la période.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={stats.topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }}
                                               axisLine={false} tickLine={false} width={90} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Ventes']} />
                                        <Bar dataKey="sales" fill="#C99B50" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-semibold text-ink mb-5">Taux de succès des achats groupés</h2>
                        {sessions.length === 0 ? (
                            <p className="text-sm text-ink-light">Vous n'avez pas encore créé de groupe.</p>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                <ResponsiveContainer width={180} height={180}>
                                    <PieChart>
                                        <Pie data={groupData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                             paddingAngle={3} dataKey="value">
                                            {groupData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-3">
                                    {groupData.map(({ name, value, color }) => (
                                        <div key={name} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <span className="text-sm text-ink">{name}</span>
                                            <span className="font-bold text-ink ml-4">{value} session(s)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
