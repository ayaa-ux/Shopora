import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { FloatingAssistant } from '../../pages/Assistant'

function Layout() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <Outlet />
            </main>
            <FloatingAssistant />
        </div>
    )
}

export default Layout