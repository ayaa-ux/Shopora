import axiosClient from './axiosClient'

/**
 * Un seul endpoint à consommer ici : POST /api/assistant/ask.
 * payload attendu : { question } -> identique à AssistantRequest.java
 */
export async function askAssistant(question) {
    const response = await axiosClient.post('/api/assistant/ask', { question })
    return response.data
}