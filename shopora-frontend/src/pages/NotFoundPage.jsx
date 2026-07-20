import { Link } from 'react-router-dom'

function NotFoundPage() {
    return (
        <div className="min-h-screen bg-linen flex flex-col items-center justify-center px-6 text-center">
            <h1 className="font-display text-3xl text-ink mb-2">404</h1>
            <p className="font-sans text-sm text-ink-light mb-6">Cette page n'existe pas.</p>
            <Link
                to="/"
                className="bg-clay hover:bg-clay-dark text-white font-sans text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
                Retour à l'accueil
            </Link>
        </div>
    )
}

export default NotFoundPage