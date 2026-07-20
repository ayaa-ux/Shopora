import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import CartDrawer from '../cart/CartDrawer'

function Navbar() {
    const navigate = useNavigate()
    const { isAuthenticated, fullName, role, avatarUrl, logout } = useAuthStore()
    const totalItems = useCartStore((state) => state.totalItems)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [cartOpen, setCartOpen] = useState(false)

    const handleLogout = () => {
        logout()
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

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 shrink-0">
                            <div className="w-9 h-9 rounded-full bg-clay flex items-center justify-center">
                                <span className="font-display text-linen font-bold text-lg">S</span>
                            </div>
                            <span className="font-display text-xl text-ink">Shopora</span>
                        </Link>

                        {/* Navigation desktop */}
                        <nav className="hidden md:flex items-center gap-6">
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                }
                            >
                                Accueil
                            </NavLink>
                            <NavLink
                                to="/catalogue"
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                }
                            >
                                Catalogue
                            </NavLink>
                            <NavLink
                                to="/group-buying"
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                }
                            >
                                Groupes
                            </NavLink>

                            {isAuthenticated && role === 'CLIENT' && (
                                <>
                                    <NavLink
                                        to="/assistant"
                                        className={({ isActive }) =>
                                            `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                        }
                                    >
                                        Assistant IA
                                    </NavLink>
                                    <NavLink
                                        to="/orders"
                                        className={({ isActive }) =>
                                            `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                        }
                                    >
                                        Mes commandes
                                    </NavLink>
                                </>
                            )}

                            {role === 'VENDOR' && (
                                <>
                                    <NavLink
                                        to="/vendor"
                                        className={({ isActive }) =>
                                            `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                        }
                                    >
                                        Espace vendeur
                                    </NavLink>
                                    <NavLink
                                        to="/create-session"
                                        className={({ isActive }) =>
                                            `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                        }
                                    >
                                        Créer un groupe
                                    </NavLink>
                                </>
                            )}

                            {role === 'ADMIN' && (
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) =>
                                        `text-sm font-medium transition-colors ${isActive ? 'text-clay' : 'text-ink hover:text-clay'}`
                                    }
                                >
                                    Administration
                                </NavLink>
                            )}
                        </nav>

                        {/* Actions droite */}
                        <div className="flex items-center gap-1 sm:gap-2">

                            {/* Recherche */}
                            {searchOpen ? (
                                <form onSubmit={handleSearch} className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Rechercher..."
                                        className="text-sm border border-sand rounded-full px-4 py-1.5 w-36 sm:w-52 focus:outline-none focus:ring-2 focus:ring-clay"
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

                            {/* Panier avec badge */}
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative p-2 text-ink-light hover:text-clay rounded-full hover:bg-quartz-light transition-colors"
                            >
                                <ShoppingBag size={20} />
                                {totalItems() > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-clay text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems()}
                  </span>
                                )}
                            </button>

                            {/* Auth */}
                            {isAuthenticated ? (
                                <div className="flex items-center gap-2 ml-1">
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="w-8 h-8 rounded-full overflow-hidden bg-clay flex items-center justify-center shrink-0 hover:ring-2 hover:ring-clay/30 transition-all"
                                        title="Mon profil"
                                    >
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-linen text-sm font-semibold">{initial}</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="hidden sm:block text-sm text-ink-light hover:text-clay transition-colors"
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
                        </div>
                    </div>
                </div>
            </header>

            {/* Tiroir panier */}
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    )
}

export default Navbar