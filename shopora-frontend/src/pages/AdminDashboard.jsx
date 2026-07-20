import { useState } from 'react'
import { Users, Store, TrendingUp, Zap, Check, X } from 'lucide-react'

const TABS = ['Vue d\'ensemble', 'Vendeurs', 'Utilisateurs']

const STATS = [
    { label: 'UTILISATEURS', value: '8', icon: Users, color: 'bg-clay/10 text-clay' },
    { label: 'VENDEURS', value: '3', icon: Store, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'REVENU TOTAL', value: '17.569 MAD', icon: TrendingUp, color: 'bg-green-50 text-green-500' },
    { label: 'GROUPES ACTIFS', value: '4', icon: Zap, color: 'bg-blue-50 text-blue-500' },
]

const VENDORS = [
    { name: 'BoutiqueMode Maroc', note: 4.6, status: 'approved' },
    { name: 'TechZone MA', note: 4.4, status: 'approved' },
    { name: 'BeautyCorner', note: 4.8, status: 'pending' },
]

const USERS = [
    { name: 'Sara Bennani', email: 'sara@example.com', role: 'Client', active: true },
    { name: 'Yassine El Amrani', email: 'yassine@example.com', role: 'Client', active: true },
    { name: 'Nadia Cherkaoui', email: 'nadia@example.com', role: 'Client', active: true },
    { name: 'BoutiqueMode Maroc', email: 'vendor1@example.com', role: 'Vendor', active: true },
    { name: 'TechZone MA', email: 'vendor2@example.com', role: 'Vendor', active: true },
]

const RECENT = [
    { id: '#o1000', status: 'Commandé', amount: '459 MAD' },
    { id: '#o1001', status: 'Confirmé', amount: '1.440 MAD' },
    { id: '#o1002', status: 'Expédié', amount: '1.620 MAD' },
]

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState(0)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-6">Administration</h1>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-100 mb-8">
                {TABS.map((tab, i) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(i)}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === i
                                ? 'text-clay border-clay'
                                : 'text-ink-light border-transparent hover:text-ink'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Vue d'ensemble */}
            {activeTab === 0 && (
                <div>
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
                        <h2 className="font-semibold text-ink mb-4">Transactions récentes</h2>
                        {RECENT.map(({ id, status, amount }) => (
                            <div key={id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                <span className="text-sm font-medium text-gray-400">{id}</span>
                                <span className="text-sm text-ink-light">{status}</span>
                                <span className="text-sm font-semibold text-ink">{amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vendeurs */}
            {activeTab === 1 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-4 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-100 bg-gray-50">
                        <span className="col-span-2">Vendeur</span>
                        <span>Note</span>
                        <span>Actions</span>
                    </div>
                    {VENDORS.map((v) => (
                        <div key={v.name} className="grid grid-cols-4 items-center px-6 py-4 border-b border-gray-50 last:border-0">
                            <span className="col-span-2 text-sm font-medium text-ink">{v.name}</span>
                            <span className="text-sm text-yellow-600">⭐ {v.note}</span>
                            <div>
                                {v.status === 'pending' ? (
                                    <button className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                                        <Check size={12} /> Approuver
                                    </button>
                                ) : (
                                    <button className="flex items-center gap-1.5 border border-red-200 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg">
                                        <X size={12} /> Suspendre
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Utilisateurs */}
            {activeTab === 2 && (
                <div>
                    <div className="flex gap-3 mb-4">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay w-64"
                        />
                        <select className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
                            <option>Tous les rôles</option>
                            <option>Client</option>
                            <option>Vendor</option>
                        </select>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="grid grid-cols-5 text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3 border-b border-gray-100 bg-gray-50">
                            <span>Nom</span>
                            <span className="col-span-2">Email</span>
                            <span>Rôle</span>
                            <span>Actions</span>
                        </div>
                        {USERS.map((u) => (
                            <div key={u.email} className="grid grid-cols-5 items-center px-6 py-4 border-b border-gray-50 last:border-0">
                                <span className="text-sm font-medium text-ink">{u.name}</span>
                                <span className="col-span-2 text-sm text-gray-400">{u.email}</span>
                                <span className="text-sm text-ink-light">{u.role}</span>
                                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                    Actif
                  </span>
                                    <button className="text-xs text-red-400 hover:text-red-600">Bannir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}