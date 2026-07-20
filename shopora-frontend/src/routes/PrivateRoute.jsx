import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Garde de route : protège l'accès aux pages qui nécessitent d'être connecté,
 * et optionnellement à un rôle précis (ex: tableau de bord réservé au VENDOR).
 *
 * Utilisation dans App.jsx :
 *   <Route element={<PrivateRoute />}>                            -> juste connecté
 *   <Route element={<PrivateRoute allowedRoles={['VENDOR']} />}>  -> rôle précis
 */
function PrivateRoute({ allowedRoles }) {
    const { isAuthenticated, role } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Connecté, mais mauvais rôle (ex: un CLIENT essaie d'accéder à une page
        // VENDOR) -> redirigé vers l'accueil, pas vers /login : le problème ici
        // est une question d'autorisation, pas d'authentification.
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default PrivateRoute