import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, MapPin, Save, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import AvatarUpload from '../components/common/AvatarUpload'

export default function Profile() {
    const navigate = useNavigate()
    const { fullName, email, role, avatarUrl, logout, updateProfile } = useAuthStore()

    const [form, setForm] = useState({
        fullName: fullName || '',
        email: email || '',
        phone: '',
        city: '',
    })

    const [editing, setEditing] = useState(false)
    const [saved, setSaved] = useState(false)
    const [errors, setErrors] = useState({})

    const initial = form.fullName ? form.fullName.charAt(0).toUpperCase() : '?'

    const roleLabel = {
        CLIENT: 'Compte Client',
        VENDOR: 'Compte Vendeur',
        ADMIN: 'Administrateur',
    }[role] || role

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
    }

    const handleAvatarChange = (base64) => {
        updateProfile({ avatarUrl: base64 })
    }

    const validate = () => {
        const newErrors = {}
        if (!form.fullName.trim()) newErrors.fullName = 'Le nom est obligatoire'
        if (!form.email.trim()) newErrors.email = "L'email est obligatoire"
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Format d'email invalide"
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = (e) => {
        e.preventDefault()
        if (!validate()) return
        updateProfile({ fullName: form.fullName, email: form.email })
        setSaved(true)
        setEditing(false)
        setTimeout(() => setSaved(false), 3000)
    }

    const handleCancel = () => {
        setEditing(false)
        setErrors({})
        setForm({
            fullName: fullName || '',
            email: email || '',
            phone: form.phone,
            city: form.city,
        })
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

            {/* En-tête */}
            <div className="flex flex-col items-center mb-10">
                <AvatarUpload
                    avatarUrl={avatarUrl}
                    initial={initial}
                    size="lg"
                    editable={true}
                    onAvatarChange={handleAvatarChange}
                />
                <p className="text-xs text-ink-light mt-3 mb-1">
                    Cliquez sur la photo pour la modifier
                </p>
                <h1 className="font-display text-2xl font-bold text-ink mt-1">
                    {form.fullName}
                </h1>
                <span className="text-sm text-ink-light">{roleLabel}</span>
            </div>

            {/* Feedback */}
            {saved && (
                <div className="mb-6 px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 text-center font-medium">
                    ✓ Profil mis à jour avec succès.
                </div>
            )}

            {/* Carte informations */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-ink">Informations personnelles</h2>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="text-sm text-clay font-medium hover:underline"
                        >
                            Modifier
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-5">

                    {/* Nom complet */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink-light mb-1.5">
                            <User size={14} /> Nom complet
                        </label>
                        {editing ? (
                            <>
                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
                                        errors.fullName ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.fullName && (
                                    <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-ink px-4 py-3 bg-gray-50 rounded-xl">
                                {form.fullName || '—'}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink-light mb-1.5">
                            <Mail size={14} /> Email
                        </label>
                        {editing ? (
                            <>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
                                        errors.email ? 'border-red-300' : 'border-gray-200'
                                    }`}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-ink px-4 py-3 bg-gray-50 rounded-xl">
                                {form.email || '—'}
                            </p>
                        )}
                    </div>

                    {/* Téléphone */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink-light mb-1.5">
                            <Phone size={14} /> Téléphone
                        </label>
                        {editing ? (
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+212 6XX XXX XXX"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                            />
                        ) : (
                            <p className="text-sm text-ink px-4 py-3 bg-gray-50 rounded-xl">
                                {form.phone || '—'}
                            </p>
                        )}
                    </div>

                    {/* Ville */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink-light mb-1.5">
                            <MapPin size={14} /> Ville
                        </label>
                        {editing ? (
                            <input
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="Casablanca, Rabat..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                            />
                        ) : (
                            <p className="text-sm text-ink px-4 py-3 bg-gray-50 rounded-xl">
                                {form.city || '—'}
                            </p>
                        )}
                    </div>

                    {/* Rôle (lecture seule) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-ink-light mb-1.5">
                            <User size={14} /> Type de compte
                        </label>
                        <p className="text-sm px-4 py-3 bg-gray-50 rounded-xl">
              <span className={`font-semibold ${
                  role === 'ADMIN' ? 'text-red-500' :
                      role === 'VENDOR' ? 'text-yellow-600' :
                          'text-clay'
              }`}>
                {roleLabel}
              </span>
                            <span className="text-ink-light ml-2 text-xs">(non modifiable)</span>
                        </p>
                    </div>

                    {/* Boutons */}
                    {editing && (
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-clay text-white font-semibold rounded-xl hover:bg-clay-dark transition-colors"
                            >
                                <Save size={16} /> Enregistrer
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Déconnexion */}
            <div className="mt-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-ink-light font-medium rounded-xl hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                    <LogOut size={16} /> Se déconnecter
                </button>
            </div>
        </div>
    )
}