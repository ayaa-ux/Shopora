import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Bot, X, MessageCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import useAssistantChat from '../hooks/useAssistantChat'
import { getProductById } from '../api/catalogApi'

const SUGGESTIONS = [
    'Un sac tendance à moins de 500 MAD',
    'Casque audio de qualité',
    'Produit beauté pour femme',
    'Sneakers pour homme',
    'Cadeau à moins de 300 MAD',
    'Tapis de sport',
]

// Cartes des produits recommandés : image, prix et lien vers la fiche produit.
function ProductSuggestions({ productIds, compact }) {
    const [products, setProducts] = useState([])

    useEffect(() => {
        let cancelled = false
        Promise.allSettled(productIds.map((id) => getProductById(id))).then((results) => {
            if (cancelled) return
            setProducts(results.filter((r) => r.status === 'fulfilled').map((r) => r.value))
        })
        return () => { cancelled = true }
    }, [productIds])

    if (products.length === 0) return null

    return (
        <div className={`mt-3 grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {products.map((product) => (
                <Link
                    key={product.id}
                    to={`/catalogue/${product.id}`}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-2 hover:border-clay hover:shadow-sm transition-all"
                >
                    <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                                Pas d'image
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-ink truncate">{product.name}</p>
                        <p className="text-xs text-clay font-bold">
                            {product.lowestPrice ? `${product.lowestPrice} MAD` : 'Prix indisponible'}
                        </p>
                        <p className="text-[10px] text-ink-light underline">Voir le produit →</p>
                    </div>
                </Link>
            ))}
        </div>
    )
}

function MessageList({ messages, loading, compact }) {
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    return (
        <div className={`${compact ? 'h-64 p-4 space-y-3' : 'h-96 p-6 space-y-4'} overflow-y-auto`}>
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {!compact && msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-clay/10 flex items-center justify-center mr-2 shrink-0">
                            <Bot size={16} className="text-clay" />
                        </div>
                    )}
                    <div className={`${compact ? 'max-w-[85%] px-3 py-2 rounded-xl text-xs' : 'max-w-[75%] px-4 py-3 rounded-2xl text-sm'} whitespace-pre-line ${
                        msg.role === 'user' ? 'bg-clay text-white rounded-br-sm' : 'bg-gray-50 text-ink rounded-bl-sm'
                    }`}>
                        {msg.text}
                        {msg.productIds?.length > 0 && (
                            <ProductSuggestions productIds={msg.productIds} compact={compact} />
                        )}
                    </div>
                </div>
            ))}

            {loading && (
                <div className="flex justify-start">
                    <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                                 style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    )
}

function ChatForm({ question, setQuestion, onSend, loading, compact, placeholder }) {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        return (
            <p className={`text-center text-ink-light ${compact ? 'text-xs' : 'text-sm'}`}>
                <Link to="/login" className="text-clay font-medium">Connectez-vous</Link> pour utiliser l'assistant.
            </p>
        )
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSend(question)
        setQuestion('')
    }

    return (
        <form onSubmit={handleSubmit} className={`flex ${compact ? 'gap-2' : 'gap-3'}`}>
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                placeholder={placeholder}
                className={`flex-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-clay ${
                    compact ? 'text-xs px-3 py-2 rounded-lg' : 'text-sm px-4 py-3 rounded-xl'
                }`}
            />
            <button
                type="submit"
                disabled={loading || !question.trim()}
                className={`bg-clay text-white disabled:opacity-50 hover:bg-clay-dark transition-colors ${
                    compact ? 'rounded-lg px-3 py-2' : 'rounded-xl px-5 py-3'
                }`}
            >
                <Send size={compact ? 14 : 18} />
            </button>
        </form>
    )
}

export default function Assistant() {
    const { messages, loading, send } = useAssistantChat()
    const [question, setQuestion] = useState('')

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <div className="w-16 h-16 bg-clay/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot size={32} className="text-clay" />
                </div>
                <h1 className="font-display text-3xl font-bold text-ink mb-3">Votre conseiller shopping IA</h1>
                <p className="text-ink-light max-w-md mx-auto">
                    Décrivez ce que vous cherchez en langage naturel. L'assistant trouve les produits
                    qui correspondent dans le catalogue ShopOra.
                </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <MessageList messages={messages} loading={loading} />
                <div className="border-t border-gray-100 p-4">
                    <ChatForm
                        question={question}
                        setQuestion={setQuestion}
                        onSend={send}
                        loading={loading}
                        placeholder="Ex : un cadeau beauté à moins de 300 MAD..."
                    />
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUGGESTIONS.map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => setQuestion(suggestion)}
                        className="text-left text-sm px-4 py-3 rounded-xl border border-gray-200 text-ink-light hover:border-clay hover:text-clay transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    )
}

// Bouton flottant : le Layout le masque sur /assistant (avant : doublon affiché sur cette page).
export function FloatingAssistant() {
    const { messages, loading, send } = useAssistantChat()
    const [open, setOpen] = useState(false)
    const [question, setQuestion] = useState('')

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

                    <MessageList messages={messages} loading={loading} compact />

                    <div className="border-t border-gray-100 p-3">
                        <ChatForm
                            question={question}
                            setQuestion={setQuestion}
                            onSend={send}
                            loading={loading}
                            compact
                            placeholder="Posez une question..."
                        />
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