/**
 * Page d'accueil : catalogue public + mise en avant du Group Buying.
 * Contenu réel à venir -> pour l'instant, cette page sert surtout à vérifier
 * que les polices et les couleurs Tailwind définies à l'étape précédente
 * sont correctement chargées.
 */
function HomePage() {
    return (
        <div className="min-h-screen bg-linen flex flex-col items-center justify-center px-6 text-center">
            <h1 className="font-display text-4xl text-ink mb-2">ShopOra</h1>
            <p className="font-sans text-ink-light">
                Achat groupé, comparateur de prix et assistant IA — bientôt ici.
            </p>
        </div>
    )
}

export default HomePage