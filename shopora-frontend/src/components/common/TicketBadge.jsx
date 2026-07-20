/**
 * Élément signature du design ShopOra : un badge en forme de ticket,
 * avec une encoche qui évoque un ticket de souk déchiré — utilisé pour
 * afficher prix et compteurs, en clin d'oeil à l'idée d'un achat partagé.
 *
 * Note technique : l'encoche est un petit cercle de la couleur du fond
 * de la page (bg-linen). Si ce badge est posé sur une carte d'une autre
 * couleur, change cette couleur pour qu'elle se fonde dans le fond réel.
 */
function TicketBadge({ label, value, accent = false }) {
    return (
        <div
            className={`relative inline-flex items-center rounded-r-xl rounded-l-sm px-4 py-2
        ${accent ? 'bg-clay text-linen' : 'bg-quartz-light text-ink'}`}
        >
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-linen" />
            <div className="ml-2">
                <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
                <p className="font-mono text-sm font-semibold">{value}</p>
            </div>
        </div>
    )
}

export default TicketBadge