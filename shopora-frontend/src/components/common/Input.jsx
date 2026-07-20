/**
 * Champ de formulaire réutilisable, avec gestion intégrée du message
 * d'erreur de validation.
 *
 * Pourquoi "error" en prop plutôt que de gérer ça dans chaque page ?
 * Parce que GlobalExceptionHandler.java renvoie les erreurs de validation
 * champ par champ (fieldErrors: { email: "Format invalide", ... }) ->
 * ce composant est conçu pour afficher directement cette donnée backend,
 * sans transformation supplémentaire. C'est ça, la "synchronisation
 * parfaite Frontend/Backend" en pratique.
 */
function Input({ label, type = 'text', value, onChange, placeholder, error, name }) {
    return (
        <div className="w-full">
            <label htmlFor={name} className="block text-sm font-medium text-ink-light mb-1">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                // Bordure rouge discrète si erreur, sinon bordure neutre.
                // On reste dans la palette : pas de rouge criard, un ton mesuré.
                className={`w-full rounded-xl border px-4 py-3 font-sans text-ink bg-linen
          focus:outline-none focus:ring-2 focus:ring-clay
          ${error ? 'border-red-400' : 'border-sand'}`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    )
}

export default Input