import axiosClient from './axiosClient'

export async function getActiveSessions() {
    const response = await axiosClient.get('/api/sessions/active')
    return response.data
}

// Sessions du vendeur connecté (GET /api/sessions/my-sessions)
export async function getMySessions() {
    const response = await axiosClient.get('/api/sessions/my-sessions')
    return response.data
}

export async function joinSession(sessionId) {
    const response = await axiosClient.post(`/api/participations/join/${sessionId}`)
    return response.data
}

// payload : { productOfferId, targetParticipants, groupPrice, durationHours }
export async function createSession(payload) {
    const response = await axiosClient.post('/api/sessions', payload)
    return response.data
}

// payload : { targetParticipants, groupPrice, durationHours }  (session active sans participant)
export async function updateSession(id, payload) {
    const response = await axiosClient.put(`/api/sessions/${id}`, payload)
    return response.data
}

// Supprime la session (aucun participant) ou l'annule avec remboursement (participants)
export async function deleteSession(id) {
    await axiosClient.delete(`/api/sessions/${id}`)
}