/**
 * Carte produit réutilisable pour la grille du catalogue.
 *
 * "lowestPrice" peut être null (aucun vendeur n'a encore créé d'offre
 * pour ce produit) -> on l'affiche clairement comme "Pas encore en vente"
 * plutôt que d'afficher un prix vide ou "0 MAD", qui induirait en erreur.
 */
function Card({ product, onClick }) {
    return (
        <button
            onClick={onClick}
            className="text-left bg-linen border border-sand rounded-2xl overflow-hidden
                 hover:shadow-md transition-shadow duration-200 w-full"
        >
            <div className="aspect-square bg-sand flex items-center justify-center">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-ink-light text-sm">Pas d'image</span>
                )}
            </div>

            <div className="p-4">
                <p className="text-xs text-clay font-medium uppercase tracking-wide">{product.category}</p>
                <h3 className="font-display text-lg text-ink mt-1 truncate">{product.name}</h3>

                {/* Badge "ticket" en JetBrains Mono, déjà introduit dans la page d'accueil
            de test -> c'est ici qu'il prend tout son sens, sur un vrai prix */}
                <div className="mt-3">
                    {product.lowestPrice ? (
                        <span className="font-mono text-sm text-ink bg-quartz-light px-3 py-1 rounded-full">
              à partir de {product.lowestPrice} MAD
            </span>
                    ) : (
                        <span className="font-mono text-sm text-ink-light">Pas encore en vente</span>
                    )}
                </div>
            </div>
        </button>
    )
}

export default Card