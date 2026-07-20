import axiosClient from './axiosClient'

export async function getAllProducts() {
    const response = await axiosClient.get('/api/products')
    return response.data
}

export async function searchProducts(keyword) {
    const response = await axiosClient.get('/api/products/search', {
        params: { keyword },
    })
    return response.data
}

export async function getProductById(id) {
    const response = await axiosClient.get(`/api/products/${id}`)
    return response.data
}

export async function getOffersByProduct(productId) {
    const response = await axiosClient.get(`/api/offers/product/${productId}`)
    return response.data
}

// Nouveau : création d'une offre par un VENDOR. payload attendu :
// { productId, price, stockQuantity } -> identique à ProductOfferRequest.java
export async function createOffer(payload) {
    const response = await axiosClient.post('/api/offers', payload)
    return response.data
}

// Récupère uniquement les offres du VENDOR connecté -> identique à
// GET /api/offers/my-offers côté backend, déjà protégé par @PreAuthorize.
export async function getMyOffers() {
    const response = await axiosClient.get('/api/offers/my-offers')
    return response.data
}

// Récupère une offre précise par son ID -> nécessaire pour le Home,
// qui doit afficher le nom du produit et son prix d'origine pour
// chaque session de Group Buying mise en avant.
export async function getOfferById(id) {
    const response = await axiosClient.get(`/api/offers/${id}`)
    return response.data
}