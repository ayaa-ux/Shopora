import { Link } from 'react-router-dom'
import { Instagram, Facebook, Twitter } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-quartz-light/40 border-t border-sand mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">

                    {/* Logo + tagline */}
                    <div className="col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-full bg-clay flex items-center justify-center">
                                <span className="font-display text-linen font-bold text-lg">S</span>
                            </div>
                            <span className="font-display text-xl text-ink">Shopora</span>
                        </div>
                        <p className="text-sm text-ink-light leading-relaxed">
                            Achetez ensemble, économisez plus. La marketplace sociale & intelligente du Maroc.
                        </p>
                    </div>

                    {/* Découvrir */}
                    <div>
                        <p className="font-semibold text-ink text-sm mb-4">Découvrir</p>
                        <ul className="space-y-3 text-sm text-ink-light">
                            <li>
                                <Link to="/catalogue" className="hover:text-clay transition-colors">
                                    Catalogue
                                </Link>
                            </li>
                            <li>
                                <Link to="/group-buying" className="hover:text-clay transition-colors">
                                    Groupes d'achat
                                </Link>
                            </li>
                            <li>
                                <Link to="/orders" className="hover:text-clay transition-colors">
                                    Mes commandes
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Espace pro */}
                    <div>
                        <p className="font-semibold text-ink text-sm mb-4">Espace pro</p>
                        <ul className="space-y-3 text-sm text-ink-light">
                            <li>
                                <Link to="/vendor" className="hover:text-clay transition-colors">
                                    Vendeur
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin" className="hover:text-clay transition-colors">
                                    Administration
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Réseaux sociaux */}
                    <div>
                        <p className="font-semibold text-ink text-sm mb-4">Suivez-nous</p>
                        <div className="flex gap-4 text-ink-light">
                            <a href="#" className="hover:text-clay transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="hover:text-clay transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="hover:text-clay transition-colors">
                                <Twitter size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-sand mt-10 pt-6 text-center text-xs text-ink-light">
                    © 2026 ShopOra. Tous droits réservés.
                </div>
            </div>
        </footer>
    )
}