import axiosClient from './axiosClient'

// ─── Client ──────────────────────────────────────────────────────────────────

// payload : { items: [{ offerId, quantity }], paymentMethod: 'CARD'|'DELIVERY',
//             firstName, lastName, address, city, postalCode, phone }
// Le prix n'est PAS envoyé : le serveur le relit dans le catalogue.
export async function createOrder(payload) {
    const response = await axiosClient.post('/api/orders', payload)
    return response.data
}

export async function getMyOrders() {
    const response = await axiosClient.get('/api/orders/my')
    return response.data
}

// ─── Vendeur ─────────────────────────────────────────────────────────────────

export async function getVendorOrders() {
    const response = await axiosClient.get('/api/orders/vendor')
    return response.data
}

export async function getVendorStats() {
    const response = await axiosClient.get('/api/orders/vendor/stats')
    return response.data
}

// status : 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' (une étape à la fois)
export async function updateItemStatus(itemId, status) {
    const response = await axiosClient.patch(`/api/orders/vendor/items/${itemId}/status`, { status })
    return response.data
}

// Libellés et couleurs partagés par les pages client et vendeur
export const STATUS_LABELS = {
    ORDERED: 'Commandé',
    CONFIRMED: 'Confirmé',
    SHIPPED: 'Expédié',
    DELIVERED: 'Livré',
}

export const STATUS_COLORS = {
    ORDERED: 'bg-blue-50 text-blue-600',
    CONFIRMED: 'bg-yellow-50 text-yellow-600',
    SHIPPED: 'bg-purple-50 text-purple-600',
    DELIVERED: 'bg-green-50 text-green-600',
}

export const NEXT_STATUS = {
    ORDERED: 'CONFIRMED',
    CONFIRMED: 'SHIPPED',
    SHIPPED: 'DELIVERED',
}

export const PAYMENT_LABELS = { CARD: 'Carte bancaire', DELIVERY: 'Paiement à la livraison' }

// Message d'erreur lisible depuis une réponse axios
export function apiErrorMessage(err, fallback = 'Une erreur est survenue.') {
    const data = err?.response?.data
    if (typeof data === 'string' && data) return data
    return data?.message || data?.error || fallback
}
