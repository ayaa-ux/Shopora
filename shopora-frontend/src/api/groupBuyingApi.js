import axiosClient from './axiosClient'

export async function getActiveSessions() {
    const response = await axiosClient.get('/api/sessions/active')
    return response.data
}

export async function joinSession(sessionId) {
    const response = await axiosClient.post(`/api/participations/join/${sessionId}`)
    return response.data
}

// Nouveau : création d'une session par un VENDOR. payload attendu :
// { productOfferId, targetParticipants, groupPrice, durationHours }
// -> identique à CreateSessionRequest.java
export async function createSession(payload) {
    const response = await axiosClient.post('/api/sessions', payload)
    return response.data
}