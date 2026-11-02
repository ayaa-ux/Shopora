import axiosClient from './axiosClient'

// ─── Utilisateurs (auth-service) ─────────────────────────────────────────────
export const getAdminUsers = async () => (await axiosClient.get('/api/auth/admin/users')).data
export const getUserStats = async () => (await axiosClient.get('/api/auth/admin/stats')).data
export const setUserEnabled = async (id, enabled) =>
    (await axiosClient.patch(`/api/auth/admin/users/${id}/enabled`, { enabled })).data
export const setUserRole = async (id, role) =>
    (await axiosClient.patch(`/api/auth/admin/users/${id}/role`, { role })).data

// ─── Catalogue (catalog-service) ─────────────────────────────────────────────
export const getCatalogStats = async () => (await axiosClient.get('/api/products/admin/stats')).data
export const getAdminOffers = async () => (await axiosClient.get('/api/offers/admin/all')).data
export const deleteAdminOffer = async (id) => axiosClient.delete(`/api/offers/admin/${id}`)
export const deleteProduct = async (id) => axiosClient.delete(`/api/products/${id}`)
export const reindexProducts = async () => axiosClient.post('/api/products/reindex')

// ─── Ventes (order-service) ──────────────────────────────────────────────────
export const getAdminOrders = async () => (await axiosClient.get('/api/orders/admin/all')).data
export const getOrderStats = async () => (await axiosClient.get('/api/orders/admin/stats')).data
export const setOrderItemStatus = async (itemId, status) =>
    (await axiosClient.patch(`/api/orders/admin/items/${itemId}/status`, { status })).data

// ─── Achats groupés (groupbuying-service) ────────────────────────────────────
export const getAdminSessions = async () => (await axiosClient.get('/api/sessions/admin/all')).data
export const getSessionStats = async () => (await axiosClient.get('/api/sessions/admin/stats')).data
export const cancelAdminSession = async (id) => axiosClient.post(`/api/sessions/admin/${id}/cancel`)
