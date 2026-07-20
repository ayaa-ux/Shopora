import { useEffect, useRef, useState } from 'react'
import { Send, Bot, X, MessageCircle } from 'lucide-react'
import { askAssistant } from '../api/assistantApi'
import { useAuthStore } from '../store/authStore'


const WELCOME = {
    role: 'assistant',
    text: "Bonjour ! Je suis l'assistant shopping de ShopOra 👋\nDécrivez ce que vous cherchez en langage naturel — par exemple : « un sac élégant à moins de 400 MAD ».",
}

export default function Assistant() {
    const { isAuthenticated } = useAuthStore()
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([WELCOME])
    const [question, setQuestion] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e) => {
        e.preventDefault()
        const trimmed = question.trim()
        if (!trimmed || loading) return

        setMessages(prev => [...prev, { role: 'user', text: trimmed }])
        setQuestion('')
        setLoading(true)

        try {
            const response = await askAssistant(trimmed)
            setMessages(prev => [
                ...prev,
                { role: 'assistant', text: response.answer, productsFound: response.productsFound },
            ])
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: error.response?.data?.message || "L'assistant est temporairement indisponible.",
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Section intro */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 bg-clay/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot size={32} className="text-clay" />
                </div>
                <h1 className="font-display text-3xl font-bold text-ink mb-3">
                    Votre conseiller shopping IA
                </h1>
                <p className="text-ink-light max-w-md mx-auto">
                    Décrivez ce que vous cherchez en langage naturel. L'assistant trouve les produits
                    qui correspondent dans le catalogue ShopOra.
                </p>
            </div>

            {/* Chat principal (page complète) */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Messages */}
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-clay/10 flex items-center justify-center mr-2 shrink-0">
                                    <Bot size={16} className="text-clay" />
                                </div>
                            )}
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line ${
                                msg.role === 'user'
                                    ? 'bg-clay text-white rounded-br-sm'
                                    : 'bg-gray-50 text-ink rounded-bl-sm'
                            }`}>
                                {msg.text}
                                {typeof msg.productsFound === 'number' && msg.productsFound > 0 && (
                                    <p className="text-xs mt-1 opacity-60">
                                        {msg.productsFound} produit(s) analysé(s)
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 rounded-full bg-clay/10 flex items-center justify-center mr-2 shrink-0">
                                <Bot size={16} className="text-clay" />
                            </div>
                            <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-sm">
                                <div className="flex gap-1">
                                    {[0, 1, 2].map(i => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-100 p-4">
                    {!isAuthenticated ? (
                        <p className="text-center text-sm text-ink-light">
                            <a href="/login" className="text-clay font-medium">Connectez-vous</a> pour utiliser l'assistant.
                        </p>
                    ) : (
                        <form onSubmit={handleSend} className="flex gap-3">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ex : un cadeau beauté à moins de 300 MAD..."
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-clay"
                            />
                            <button
                                type="submit"
                                disabled={loading || !question.trim()}
                                className="bg-clay text-white rounded-xl px-5 py-3 disabled:opacity-50 hover:bg-clay-dark transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Suggestions */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    'Un sac tendance à moins de 500 MAD',
                    'Casque audio de qualité',
                    'Produit beauté pour femme',
                    'Sneakers pour homme',
                    'Cadeau à moins de 300 MAD',
                    'Tapis de sport',
                ].map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => setQuestion(suggestion)}
                        className="text-left text-sm px-4 py-3 rounded-xl border border-gray-200 text-ink-light hover:border-clay hover:text-clay transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            {/* Bouton flottant (visible sur les autres pages) */}
            <FloatingAssistant />
        </div>
    )
}

export function FloatingAssistant() {
    const { isAuthenticated } = useAuthStore()
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([WELCOME])
    const [question, setQuestion] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, open])

    const handleSend = async (e) => {
        e.preventDefault()
        const trimmed = question.trim()
        if (!trimmed || loading) return

        setMessages(prev => [...prev, { role: 'user', text: trimmed }])
        setQuestion('')
        setLoading(true)

        try {
            const response = await askAssistant(trimmed)
            setMessages(prev => [...prev, { role: 'assistant', text: response.answer }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant', text: "L'assistant est temporairement indisponible."
            }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {open && (
                <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-clay">
                        <div className="flex items-center gap-2">
                            <Bot size={18} className="text-white" />
                            <span className="text-white text-sm font-semibold">Assistant ShopOra</span>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="h-64 overflow-y-auto p-4 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                                    msg.role === 'user'
                                        ? 'bg-clay text-white rounded-br-sm'
                                        : 'bg-gray-50 text-ink rounded-bl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-50 px-3 py-2 rounded-xl rounded-bl-sm">
                                    <div className="flex gap-1">
                                        {[0,1,2].map(i => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
                                                 style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="border-t border-gray-100 p-3">
                        {!isAuthenticated ? (
                            <p className="text-center text-xs text-ink-light">
                                <a href="/login" className="text-clay">Connectez-vous</a> pour utiliser l'assistant.
                            </p>
                        ) : (
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Posez une question..."
                                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-clay"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !question.trim()}
                                    className="bg-clay text-white rounded-lg px-3 py-2 disabled:opacity-50"
                                >
                                    <Send size={14} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-4 right-4 sm:right-6 z-50 w-12 h-12 bg-clay text-white rounded-full shadow-lg hover:bg-clay-dark transition-colors flex items-center justify-center"
            >
                {open ? <X size={20} /> : <MessageCircle size={20} />}
            </button>
        </>
    )
}