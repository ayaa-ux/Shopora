import axios from 'axios'
import { useAuthStore } from '../store/authStore'

/**
 * Instance Axios unique, réutilisée par TOUS les fichiers api/*.js du projet
 * (authApi.js, catalogApi.js, groupBuyingApi.js, assistantApi.js...).
 * Centraliser ici l'ajout du token JWT évite de répéter cette logique
 * dans chaque appel HTTP individuel.
 */
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

// Intercepteur de REQUÊTE : attache automatiquement "Authorization: Bearer <token>"
// à chaque appel sortant, si l'utilisateur est connecté. C'est exactement
// le header que JwtFilter attend côté backend, sur les 5 microservices.
axiosClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Intercepteur de RÉPONSE : si le backend renvoie 401 (token expiré ou
// invalide), on déconnecte proprement l'utilisateur côté frontend plutôt
// que de le laisser face à des erreurs silencieuses sur chaque page.
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default axiosClient