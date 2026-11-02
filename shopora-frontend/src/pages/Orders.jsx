import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { getMyOrders, STATUS_LABELS, STATUS_COLORS, PAYMENT_LABELS, apiErrorMessage } from '../api/orderApi'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        getMyOrders()
            .then((data) => { if (!cancelled) setOrders(data) })
            .catch((err) => { if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger vos commandes.')) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="font-display text-3xl font-bold text-ink mb-1">Mes commandes</h1>
            <p className="text-ink-light text-sm mb-8">{loading ? '...' : `${orders.length} commande(s)`}</p>

            {error && (
                <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
            )}

            {loading ? (
                <p className="text-center text-ink-light py-16">Chargement...</p>
            ) : orders.length === 0 && !error ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
                    <Package size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-ink-light mb-3">Vous n'avez pas encore passé de commande.</p>
                    <Link to="/catalogue" className="text-clay font-medium hover:underline">
                        Découvrir le catalogue →
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <div>
                                    <p className="font-semibold text-ink">{order.orderNumber}</p>
                                    <p className="text-xs text-ink-light">
                                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                            day: 'numeric', month: 'long', year: 'numeric',
                                        })}
                                        {' · '}{PAYMENT_LABELS[order.paymentMethod]}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                                    {STATUS_LABELS[order.status]}
                                </span>
                            </div>

                            <div className="space-y-2 border-t border-gray-50 pt-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center gap-3 text-sm">
                                        <span className="text-ink-light truncate flex-1">
                                            {item.productName} × {item.quantity}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[item.status]}`}>
                                            {STATUS_LABELS[item.status]}
                                        </span>
                                        <span className="text-ink shrink-0">{Number(item.lineTotal).toFixed(2)} MAD</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between font-bold text-ink border-t border-gray-100 mt-3 pt-3">
                                <span>Total</span>
                                <span>{Number(order.total).toFixed(2)} MAD</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
