import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import { FloatingAssistant } from '../../pages/Assistant'
import { useAuthStore } from '../../store/authStore'

function Layout() {
    const { pathname } = useLocation()
    const { isAuthenticated, role } = useAuthStore()

    // L'assistant est réservé aux CLIENT (le backend refuse les autres rôles) :
    // on l'affiche aux visiteurs (invitation à se connecter) et aux clients,
    // et pas sur la page /assistant elle-même.
    const showAssistant = pathname !== '/assistant' && (!isAuthenticated || role === 'CLIENT')

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <Outlet />
            </main>
            {showAssistant && <FloatingAssistant />}
        </div>
    )
}

export default Layout