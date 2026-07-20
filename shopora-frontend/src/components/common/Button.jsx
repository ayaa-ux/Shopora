/**
 * Bouton réutilisable, seule source de vérité pour le style des actions
 * dans toute l'application. Centraliser ici évite d'avoir un bouton
 * légèrement différent sur chaque page (incohérence visuelle classique
 * quand chaque formulaire réinvente son propre style).
 *
 * variant="primary"   : action principale (CTA) -> fond Argile (clay)
 * variant="secondary" : action secondaire -> fond Rose Poudré clair
 * variant="outline"   : action discrète -> juste une bordure
 */
function Button({
                    children,
                    variant = 'primary',
                    type = 'button',
                    fullWidth = false,
                    disabled = false,
                    loading = false,
                    onClick,
                }) {
    const baseStyles =
        'font-sans font-semibold rounded-full px-6 py-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
        primary: 'bg-clay text-linen hover:bg-clay-dark',
        secondary: 'bg-quartz-light text-ink hover:bg-quartz',
        outline: 'bg-transparent border border-ink-light text-ink hover:bg-sand',
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''}`}
        >
            {/* État de chargement simple : pas de spinner SVG complexe ici,
          un texte suffit pour un projet de ce niveau et reste accessible */}
            {loading ? 'Chargement...' : children}
        </button>
    )
}

export default Button