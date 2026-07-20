import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api/authApi'
import { useAuthStore } from '../store/authStore'

export default function Register() {
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)
    const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'CLIENT' })
    const [fieldErrors, setFieldErrors] = useState({})
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFieldErrors({})
        setErrorMessage('')
        setLoading(true)
        try {
            const response = await registerUser(form)
            login(response)
            navigate('/')
        } catch (error) {
            const data = error.response?.data
            if (data?.fieldErrors) setFieldErrors(data.fieldErrors)
            else setErrorMessage(data?.message || 'Une erreur est survenue.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-quartz-light/30 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h1 className="font-display text-2xl font-bold text-ink mb-1">Créer un compte</h1>
                <p className="text-ink-light text-sm mb-6">Rejoignez la communauté Shopora.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { label: 'Nom complet', name: 'fullName', type: 'text', placeholder: 'Sara Bennani' },
                        { label: 'Email', name: 'email', type: 'email', placeholder: 'vous@exemple.com' },
                        { label: 'Mot de passe', name: 'password', type: 'password', placeholder: '8 caractères minimum' },
                    ].map(({ label, name, type, placeholder }) => (
                        <div key={name}>
                            <label className="block text-sm font-medium text-ink mb-1">{label}</label>
                            <input
                                type={type} name={name} value={form[name]} onChange={handleChange}
                                placeholder={placeholder}
                                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-clay ${
                                    fieldErrors[name] ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />
                            {fieldErrors[name] && <p className="text-xs text-red-500 mt-1">{fieldErrors[name]}</p>}
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium text-ink mb-1">Type de compte</label>
                        <select
                            name="role" value={form.role} onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay bg-white"
                        >
                            <option value="CLIENT">Client</option>
                            <option value="VENDOR">Vendeur</option>
                        </select>
                    </div>

                    {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

                    <button
                        type="submit" disabled={loading}
                        className="w-full py-3 bg-clay text-white font-semibold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Création...' : 'Créer mon compte'}
                    </button>
                </form>

                <p className="text-sm text-center text-ink-light mt-6">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-clay font-medium">Connexion</Link>
                </p>
            </div>
        </div>
    )
}