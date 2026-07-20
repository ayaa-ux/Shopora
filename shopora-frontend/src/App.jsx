import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Catalogue from './pages/Catalogue'
import ProductDetail from './pages/ProductDetail'
import GroupBuying from './pages/GroupBuying'
import Assistant from './pages/Assistant'
import CreateSession from './pages/CreateSession'
import AdminDashboard from './pages/AdminDashboard'
import Layout from './components/layout/Layout'
import PrivateRoute from './routes/PrivateRoute'
import Checkout from './pages/Checkout'
import Profile from './pages/Profile'

// Ajoute ces deux imports dans le bloc VendorDashboard
import {
    VendorLayout,
    VendorHome,
    VendorProducts,
    VendorGroups,
    VendorOrders,   // nouveau
    VendorStats,    // nouveau
} from './pages/VendorDashboard'

function App() {
    return (
        <Routes>
            {/* Routes publiques sans layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes publiques avec Layout (Navbar + FloatingAssistant) */}
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/catalogue" element={<Catalogue />} />
                <Route path="/catalogue/:id" element={<ProductDetail />} />
                <Route path="/group-buying" element={<GroupBuying />} />
            </Route>

            {/* Routes protégées : tout utilisateur connecté */}
            <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                    <Route path="/assistant" element={<Assistant />} />
                    <Route path="/orders" element={<div className="p-8 text-center text-ink-light">Mes commandes (à venir)</div>} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Route>

            {/* Routes protégées VENDOR avec Layout standard */}
            <Route element={<PrivateRoute allowedRoles={['VENDOR']} />}>
                <Route element={<Layout />}>
                    <Route path="/create-session" element={<CreateSession />} />
                </Route>
            </Route>

            {/* Espace Vendeur avec layout sidebar */}
            <Route element={<PrivateRoute allowedRoles={['VENDOR']} />}>
                <Route element={<VendorLayout />}>
                    <Route path="/vendor" element={<VendorHome />} />
                    <Route path="/vendor/products" element={<VendorProducts />} />
                    <Route path="/vendor/groups" element={<VendorGroups />} />
                    <Route path="/vendor/orders" element={<VendorOrders />} />
                    <Route path="/vendor/stats" element={<VendorStats />} />
                </Route>
            </Route>

            {/* Espace Admin */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                <Route element={<Layout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route>
            </Route>
        </Routes>
    )
}

export default App