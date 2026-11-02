import { useNavigate } from 'react-router-dom'

/**
 * Vitrine du comparateur de prix avec des données RÉELLES : offres d'un produit
 * du catalogue + meilleures offres de ses produits similaires, triées par prix.
 * Chaque ligne mène à la fiche produit correspondante.
 */
function ComparatorShowcase({ rows = [] }) {
    const navigate = useNavigate()
    const visible = rows.slice(0, 4)

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

                {visible.length > 0 ? (
                    <div className="bg-linen border border-sand rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-[1.6fr_1fr_0.8fr] gap-3 text-xs font-semibold text-ink-light uppercase tracking-wide px-5 py-3 border-b border-sand">
                            <span>Vendeur</span>
                            <span>Prix</span>
                            <span className="text-right">Stock</span>
                        </div>
                        {visible.map((row, index) => (
                            <button
                                key={row.key}
                                onClick={() => navigate(`/catalogue/${row.productId}`)}
                                className={`w-full text-left grid grid-cols-[1.6fr_1fr_0.8fr] gap-3 items-center px-5 py-4 text-sm hover:bg-white/60 transition-colors ${
                                    index < visible.length - 1 ? 'border-b border-sand' : ''
                                }`}
                            >
                                <span className="min-w-0">
                                    <span className="block text-ink truncate">{row.vendorEmail}</span>
                                    <span className="block text-xs text-ink-light truncate">{row.productName}</span>
                                </span>
                                <span>
                                    <span className="block font-mono text-ink">{row.price} MAD</span>
                                    {index === 0 && visible.length > 1 && (
                                        <span className="inline-block mt-1 bg-clay text-linen text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                                            Meilleur prix
                                        </span>
                                    )}
                                </span>
                                <span className="text-right text-ink-light">
                                    {row.stock == null ? 'En stock' : `${row.stock} en stock`}
                                </span>
                            </button>
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
