import axiosClient from './axiosClient'

/**
 * Regroupe tous les appels HTTP liés à auth-service.
 * Chaque fonction retourne directement response.data : les composants
 * qui appellent ces fonctions reçoivent du JSON propre, sans avoir
 * à connaître les détails d'Axios (response.data, status...).
 */

export async function registerUser(payload) {
    // payload attendu : { fullName, email, password, role }
    // Champs identiques à RegisterRequest.java -> aucune transformation nécessaire
    const response = await axiosClient.post('/api/auth/register', payload)
    return response.data
}

export async function loginUser(payload) {
    // payload attendu : { email, password }, identique à LoginRequest.java
    const response = await axiosClient.post('/api/auth/login', payload)
    return response.data
}