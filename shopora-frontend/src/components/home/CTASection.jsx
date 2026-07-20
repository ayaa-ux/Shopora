import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

/**
 * Section CTA gradient rose → doré, visible uniquement aux visiteurs
 * non connectés. Reproduit exactement la capture : fond dégradé arrondi,
 * texte blanc, bouton "S'inscrire" avec icône.
 */
export default function CTASection() {
    const { isAuthenticated } = useAuthStore()

    if (isAuthenticated) return null

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div
                className="rounded-2xl p-10 sm:p-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                style={{
                    background: 'linear-gradient(135deg, #C25B7A 0%, #C98C50 100%)',
                }}
            >
                <div>
                    <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
                        Prêt à rejoindre Shopora ?
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base">
                        Créez votre compte gratuitement et accédez aux meilleurs prix groupés.
                    </p>
                </div>

                <Link
                    to="/register"
                    className="shrink-0 flex items-center gap-2 bg-white text-ink font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <UserPlus size={18} />
                    S'inscrire
                </Link>
            </div>
        </section>
    )
}
