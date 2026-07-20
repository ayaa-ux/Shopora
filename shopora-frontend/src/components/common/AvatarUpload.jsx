import { useRef } from 'react'
import { Camera } from 'lucide-react'

/**
 * Composant réutilisable pour afficher et modifier un avatar.
 * Convertit l'image sélectionnée en base64 et appelle onAvatarChange(base64).
 * Aucun upload serveur : tout reste en mémoire/localStorage via Zustand.
 */
export default function AvatarUpload({ avatarUrl, initial, size = 'lg', onAvatarChange, editable = true }) {
    const inputRef = useRef(null)

    const sizeClasses = {
        sm: { container: 'w-10 h-10', text: 'text-lg', camera: 'w-5 h-5', icon: 10 },
        md: { container: 'w-16 h-16', text: 'text-2xl', camera: 'w-6 h-6', icon: 12 },
        lg: { container: 'w-24 h-24', text: 'text-4xl', camera: 'w-8 h-8', icon: 14 },
    }[size]

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Vérifie que c'est bien une image
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner une image.')
            return
        }

        // Limite à 5 MB pour éviter de saturer localStorage
        if (file.size > 5 * 1024 * 1024) {
            alert('L\'image ne doit pas dépasser 5 MB.')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            onAvatarChange?.(event.target.result)
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="relative inline-block">
            {/* Avatar */}
            <div
                onClick={() => editable && inputRef.current?.click()}
                className={`${sizeClasses.container} rounded-full overflow-hidden bg-clay flex items-center justify-center shadow-md ${
                    editable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
                }`}
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className={`font-display font-bold text-linen ${sizeClasses.text}`}>
            {initial}
          </span>
                )}
            </div>

            {/* Bouton appareil photo */}
            {editable && (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className={`absolute bottom-0 right-0 ${sizeClasses.camera} bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors`}
                >
                    <Camera size={sizeClasses.icon} className="text-ink-light" />
                </button>
            )}

            {/* Input caché */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}