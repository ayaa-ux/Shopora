import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    BarChart2, TrendingUp, Plus
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const sidebarItems = [
    { to: '/vendor', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/vendor/products', label: 'Produits', icon: Package },
    { to: '/vendor/groups', label: 'Group Buying', icon: Users },
    { to: '/vendor/orders', label: 'Commandes', icon: ShoppingCart },
    { to: '/vendor/stats', label: 'Statistiques', icon: BarChart2 },
]

const STATS = [
    { label: 'REVENUS (30J)', value: '17.569 MAD', icon: TrendingUp, color: 'bg-clay/10 text-clay' },
    { label: 'COMMANDES', value: '15', icon: ShoppingCart, color: 'bg-blue-50 text-blue-500' },
    { label: 'GROUPES ACTIFS', value: '4', icon: Users, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'PRODUITS', value: '20', icon: Package, color: 'bg-green-50 text-green-500' },
]

const RECENT = [
    { id: '#o1000', status: 'Commandé', amount: '459 MAD' },
    { id: '#o1001', status: 'Confirmé', amount: '1.440 MAD' },
    { id: '#o1002', status: 'Expédié', amount: '1.620 MAD' },
    { id: '#o1003', status: 'Livré', amount: '280 MAD' },
]

export function VendorLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 shrink-0">
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
                                        isActive
                                            ? 'bg-clay text-white'
                                            : 'text-ink hover:bg-gray-50'
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
    )
}

export function VendorHome() {
    return (
        <div>
            <h1 className="font-display text-3xl font-bold text-ink mb-1">Tableau de bord</h1>
            <p className="text-ink-light text-sm mb-8">Aperçu de votre activité.</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {STATS.map(({ label, value, icon: Icon, color }) => (
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
                <div className="space-y-3">
                    {RECENT.map(({ id, status, amount }) => (
                        <div key={id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
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

export function VendorProducts() {
    const navigate = useNavigate()
    const PRODUCTS = [
        { id: 1, name: 'Robe florale midi', category: 'Mode', stock: 24, price: '459 MAD', img: null },
        { id: 2, name: 'Sac en cuir bordeaux', category: 'Mode', stock: 12, price: '720 MAD', img: null },
        { id: 3, name: 'Sneakers blanches', category: 'Sport', stock: 30, price: '540 MAD', img: null },
        { id: 4, name: 'Sérum éclat à la rose', category: 'Beauté', stock: 50, price: '280 MAD', img: null },
    ]

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-3xl font-bold text-ink">Produits</h1>
                <button
                    onClick={() => navigate('/create-session')}
                    className="flex items-center gap-2 bg-clay text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-clay-dark transition-colors"
                >
                    <Plus size={16} /> Nouveau produit
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-5 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="col-span-2">Produit</span>
                    <span>Catégorie</span>
                    <span>Stock</span>
                    <span>Prix</span>
                </div>
                {PRODUCTS.map((p) => (
                    <div key={p.id} className="grid grid-cols-5 items-center px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <div className="col-span-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                            <span className="text-sm font-medium text-ink">{p.name}</span>
                        </div>
                        <span className="text-sm text-gray-400">{p.category}</span>
                        <span className="text-sm text-ink">{p.stock}</span>
                        <span className="text-sm font-semibold text-ink">{p.price}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function VendorGroups() {
    const navigate = useNavigate()
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-3xl font-bold text-ink">Group Buying</h1>
                <button
                    onClick={() => navigate('/create-session')}
                    className="flex items-center gap-2 bg-clay text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-clay-dark transition-colors"
                >
                    <Plus size={16} /> Créer un groupe
                </button>
            </div>
            <p className="text-ink-light">Gérez vos sessions d'achat groupé ici.</p>
        </div>
    )
}