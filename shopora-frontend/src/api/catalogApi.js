import axiosClient from './axiosClient'

export async function getAllProducts() {
    const response = await axiosClient.get('/api/products')
    return response.data
}

export async function searchProducts(keyword) {
    const response = await axiosClient.get('/api/products/search', { params: { keyword } })
    return response.data
}

export async function getProductById(id) {
    const response = await axiosClient.get(`/api/products/${id}`)
    return response.data
}

// payload : { name, description, category, imageUrl } -> ProductRequest.java
export async function createProduct(payload) {
    const response = await axiosClient.post('/api/products', payload)
    return response.data
}

export async function getOffersByProduct(productId) {
    const response = await axiosClient.get(`/api/offers/product/${productId}`)
    return response.data
}

// payload : { productId, price, stockQuantity } -> ProductOfferRequest.java
export async function createOffer(payload) {
    const response = await axiosClient.post('/api/offers', payload)
    return response.data
}

export async function updateOffer(id, payload) {
    const response = await axiosClient.put(`/api/offers/${id}`, payload)
    return response.data
}

export async function deleteOffer(id) {
    await axiosClient.delete(`/api/offers/${id}`)
}

export async function getMyOffers() {
    const response = await axiosClient.get('/api/offers/my-offers')
    return response.data
}

export async function getOfferById(id) {
    const response = await axiosClient.get(`/api/offers/${id}`)
    return response.data
}

// ADMIN : réindexe tout le catalogue dans l'assistant IA
export async function reindexCatalog() {
    await axiosClient.post('/api/products/reindex')
}