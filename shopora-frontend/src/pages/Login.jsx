import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../api/authApi'
import { useAuthStore } from '../store/authStore'

export default function Login() {
    const navigate = useNavigate()
    const login = useAuthStore((state) => state.login)
    const [form, setForm] = useState({ email: '', password: '' })
    const [errorMessage, setErrorMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setLoading(true)
        try {
            const response = await loginUser(form)
            login(response)
            // Redirige vers la bonne page selon le rôle
            if (response.role === 'ADMIN') {
                navigate('/admin')
            } else if (response.role === 'VENDOR') {
                navigate('/vendor')
            } else {
                navigate('/')
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Une erreur est survenue.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-quartz-light/30 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h1 className="font-display text-2xl font-bold text-ink mb-1">Bon retour</h1>
                <p className="text-ink-light text-sm mb-6">Connectez-vous à votre compte Shopora.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-ink mb-1">Email</label>
                        <input
                            type="email" name="email" value={form.email} onChange={handleChange}
                            placeholder="vous@exemple.com"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink mb-1">Mot de passe</label>
                        <input
                            type="password" name="password" value={form.password} onChange={handleChange}
                            placeholder="••••••"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                        />
                    </div>

                    {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

                    <button
                        type="submit" disabled={loading}
                        className="w-full py-3 bg-clay text-white font-semibold rounded-xl hover:bg-clay-dark transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <p className="text-sm text-center text-ink-light mt-6">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="text-clay font-medium">S'inscrire</Link>
                </p>
            </div>
        </div>
    )
}