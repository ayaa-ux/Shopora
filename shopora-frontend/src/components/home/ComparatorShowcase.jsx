/**
 * Vitrine du comparateur de prix, avec un produit RÉEL du catalogue
 * (le premier qui a déjà des offres) -> contrairement au mockup, pas de
 * colonnes "Note"/"Livraison" : ces données n'existent pas dans notre
 * modèle (hors cahier des charges). On affiche le Stock à la place,
 * une donnée réellement présente en base.
 */
function ComparatorShowcase({ product, offers }) {
    return (
        <section className="px-4 py-14 sm:px-8 bg-quartz-light/40">
            <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-10 items-center">
                <div>
                    <span className="text-xs font-medium text-clay uppercase tracking-wide">Comparateur de prix</span>
                    <h2 className="font-display text-3xl text-ink mt-2">Le meilleur prix, sans chercher.</h2>
                    <p className="text-ink-light mt-3 max-w-sm">
                        Sur chaque produit, comparez en un coup d'oeil les offres des vendeurs ShopOra :
                        prix et disponibilité en stock.
                    </p>
                </div>

                {product && offers?.length > 0 ? (
                    <div className="bg-linen border border-sand rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-3 text-xs font-semibold text-ink-light uppercase tracking-wide px-5 py-3 border-b border-sand">
                            <span>Vendeur</span>
                            <span>Prix</span>
                            <span className="text-right">Stock</span>
                        </div>
                        {offers.slice(0, 3).map((offer, index) => (
                            <div
                                key={offer.id}
                                className={`grid grid-cols-3 items-center px-5 py-4 text-sm ${
                                    index < offers.length - 1 ? 'border-b border-sand' : ''
                                }`}
                            >
                                <span className="text-ink truncate">{offer.vendorEmail}</span>
                                <span className="font-mono text-ink">
                  {offer.price} MAD
                                    {index === 0 && (
                                        <span className="ml-2 bg-clay text-linen text-[10px] px-2 py-0.5 rounded-full">
                      Meilleur prix
                    </span>
                                    )}
                </span>
                                <span className="text-right text-ink-light">{offer.stockQuantity} en stock</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-ink-light text-sm italic">
                        Le comparateur s'affichera ici dès que des offres seront publiées sur le catalogue.
                    </p>
                )}
            </div>
        </section>
    )
}

export default ComparatorShowcase