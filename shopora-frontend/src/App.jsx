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
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import NotFoundPage from './pages/NotFoundPage'
import Layout from './components/layout/Layout'
import PrivateRoute from './routes/PrivateRoute'
import {
    VendorLayout,
    VendorHome,
    VendorProducts,
    VendorGroups,
    VendorOrders,
    VendorStats,
} from './pages/VendorDashboard'

function App() {
    return (
        <Routes>
            {/* Publiques sans layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Publiques avec layout */}
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/catalogue" element={<Catalogue />} />
                <Route path="/catalogue/:id" element={<ProductDetail />} />
                <Route path="/group-buying" element={<GroupBuying />} />
            </Route>

            {/* Tout utilisateur connecté */}
            <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Route>

            {/* CLIENT uniquement (le backend refuse déjà les autres rôles) */}
            <Route element={<PrivateRoute allowedRoles={['CLIENT']} />}>
                <Route element={<Layout />}>
                    <Route path="/assistant" element={<Assistant />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/checkout" element={<Checkout />} />
                </Route>
            </Route>

            {/* VENDOR */}
            <Route element={<PrivateRoute allowedRoles={['VENDOR']} />}>
                <Route element={<Layout />}>
                    <Route path="/create-session" element={<CreateSession />} />
                </Route>
                <Route element={<VendorLayout />}>
                    <Route path="/vendor" element={<VendorHome />} />
                    <Route path="/vendor/products" element={<VendorProducts />} />
                    <Route path="/vendor/groups" element={<VendorGroups />} />
                    <Route path="/vendor/orders" element={<VendorOrders />} />
                    <Route path="/vendor/stats" element={<VendorStats />} />
                </Route>
            </Route>

            {/* ADMIN */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                <Route element={<Layout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route>
            </Route>

            {/* 404 : NotFoundPage existait mais n'était branchée nulle part */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default App