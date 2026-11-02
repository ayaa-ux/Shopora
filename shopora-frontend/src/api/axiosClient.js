import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 401 = session expirée -> déconnexion. MAIS pas pour /api/auth/* (un mot de passe
// incorrect renvoie aussi 401 : avant, la page se rechargeait et le message d'erreur
// disparaissait) ni quand l'utilisateur n'avait pas de token.
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status
        const isAuthCall = (error.config?.url || '').includes('/api/auth/')
        const hadToken = !!useAuthStore.getState().token

        if (status === 401 && hadToken && !isAuthCall) {
            useAuthStore.getState().logout()
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default axiosClient