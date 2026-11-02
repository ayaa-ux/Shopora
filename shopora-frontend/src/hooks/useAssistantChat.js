import { useCallback, useState } from 'react'
import { askAssistant } from '../api/assistantApi'

export const WELCOME = {
    role: 'assistant',
    text: "Bonjour ! Je suis l'assistant shopping de ShopOra 👋\nDécrivez ce que vous cherchez en langage naturel — par exemple : « un sac élégant à moins de 400 MAD ».",
}

/** Logique de chat partagée entre la page Assistant et le bouton flottant. */
export default function useAssistantChat() {
    const [messages, setMessages] = useState([WELCOME])
    const [loading, setLoading] = useState(false)

    const send = useCallback(async (text) => {
        const question = text.trim()
        if (!question || loading) return

        setMessages((prev) => [...prev, { role: 'user', text: question }])
        setLoading(true)

        try {
            const response = await askAssistant(question)
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: response.answer,
                    productsFound: response.productsFound,
                    productIds: response.productIds ?? [],
                },
            ])
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: error.response?.data?.message || "L'assistant est temporairement indisponible.",
                },
            ])
        } finally {
            setLoading(false)
        }
    }, [loading])

    return { messages, loading, send }
}