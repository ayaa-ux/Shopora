import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, X, Menu } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import CartDrawer from '../cart/CartDrawer'

function Navbar() {
    const navigate = useNavigate()
    const { isAuthenticated, fullName, role, avatarUrl, logout } = useAuthStore()

    // Sélecteur sur la VALEUR (et non sur la fonction) : le badge se met enfin à jour
    // à chaque ajout au panier.
    const cartCount = useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0))

    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [cartOpen, setCartOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    const links = [
        { to: '/', label: 'Accueil', end: true },
        { to: '/catalogue', label: 'Catalogue' },
        { to: '/group-buying', label: 'Groupes' },
        ...(isAuthenticated && role === 'CLIENT'
            ? [{ to: '/assistant', label: 'Assistant IA' }, { to: '/orders', label: 'Mes commandes' }]
            : []),
        ...(role === 'VENDOR'
            ? [{ to: '/vendor', label: 'Espace vendeur' }, { to: '/create-session', label: 'Créer un groupe' }]
            : []),
        ...(role === 'ADMIN' ? [{ to: '/admin', label: 'Administration' }] : []),
    ]

    const linkClass = ({ isActive }) =>
        `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`

    const handleLogout = () => {
        logout()
        setMenuOpen(false)
        navigate('/login')
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`)
            setSearchOpen(false)
            setSearchQuery('')
        }
    }

    const initial = fullName ? fullName.charAt(0).toUpperCase() : '?'

    return (
        <>
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        <Link to="/" className="flex items-center gap-2 shrink-0">
                            <div className="w-9 h-9 rounded-full bg-clay flex items-center justify-center">
                                <span className="font-display text-linen font-bold text-lg">S</span>
                            </div>
                            <span className="font-display text-xl text-ink">Shopora</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            {links.map(({ to, label, end }) => (
                                <NavLink key={to} to={to} end={end} className={linkClass}>{label}</NavLink>
                            ))}
                        </nav>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {searchOpen ? (
                                <form onSubmit={handleSearch} className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Rechercher..."
                                        className="text-sm border border-sand rounded-full px-4 py-1.5 w-32 sm:w-52 focus:outline-none focus:ring-2 focus:ring-clay"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                                        className="text-ink-light hover:text-ink"
                                    >
                                        <X size={18} />
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setSearchOpen(true)}
                                    className="p-2 text-ink-light hover:text-clay rounded-full hover:bg-quartz-light transition-colors"
                                >
                                    <Search size={20} />
                                </button>
                            )}

                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative p-2 text-ink-light hover:text-clay rounded-full hover:bg-quartz-light transition-colors"
                            >
                                <ShoppingBag size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-clay text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {isAuthenticated ? (
                                <div className="flex items-center gap-2 ml-1">
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="w-8 h-8 rounded-full overflow-hidden bg-clay flex items-center justify-center shrink-0 hover:ring-2 hover:ring-clay/30 transition-all"
                                        title="Mon profil"
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-linen text-sm font-semibold">{initial}</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="hidden md:block text-sm text-ink-light hover:text-clay transition-colors"
                                    >
                                        Déconnexion
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 sm:gap-2 ml-1">
                                    <Link
                                        to="/login"
                                        className="hidden sm:block text-sm font-medium text-ink hover:text-clay transition-colors px-3 py-1.5"
                                    >
                                        Connexion
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="text-sm font-semibold bg-clay text-linen rounded-full px-4 py-1.5 hover:bg-clay-dark transition-colors"
                                    >
                                        Inscription
                                    </Link>
                                </div>
                            )}

                            {/* Menu mobile : avant, aucune navigation n'existait sous 768px */}
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="md:hidden p-2 text-ink-light hover:text-clay rounded-full"
                                aria-label="Menu"
                            >
                                {menuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                {menuOpen && (
                    <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
                        {links.map(({ to, label, end }) => (
                            <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setMenuOpen(false)}>
                                {label}
                            </NavLink>
                        ))}
                        {isAuthenticated ? (
                            <button onClick={handleLogout} className="text-left text-sm text-ink-light hover:text-clay">
                                Déconnexion
                            </button>
                        ) : (
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-ink">
                                Connexion
                            </Link>
                        )}
                    </nav>
                )}
            </header>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    )
}

export default Navbar