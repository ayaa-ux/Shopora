import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'

export default function CartDrawer({ open, onClose }) {
    const navigate = useNavigate()
    const { items, removeItem, updateQuantity, totalPrice } = useCartStore()

    const handleCheckout = () => {
        onClose()
        navigate('/checkout')
    }

    return (
        <>
            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Tiroir */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h2 className="font-display text-xl font-bold text-ink">Votre panier</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-ink-light transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Articles */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <ShoppingBag size={28} className="text-gray-300" />
                            </div>
                            <p className="text-ink-light">Votre panier est vide.</p>
                            <button
                                onClick={() => { onClose(); navigate('/catalogue') }}
                                className="text-sm text-clay font-medium hover:underline"
                            >
                                Découvrir le catalogue
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                                >
                                    {/* Image */}
                                    <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200" />
                                        )}
                                    </div>

                                    {/* Infos */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-ink truncate">{item.name}</p>
                                        <p className="text-xs text-ink-light mb-2">{item.vendorEmail}</p>
                                        <p className="text-sm font-bold text-clay">{item.price} MAD</p>
                                    </div>

                                    {/* Quantité + suppression */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-gray-300 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="text-ink-light hover:text-ink"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-sm font-semibold text-ink w-4 text-center">
                        {item.quantity}
                      </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="text-ink-light hover:text-ink"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer avec total + bouton */}
                {items.length > 0 && (
                    <div className="px-6 py-5 border-t border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-ink-light">Total</span>
                            <span className="font-bold text-xl text-ink">
                {totalPrice().toFixed(2)} MAD
              </span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full py-3.5 bg-clay text-white font-bold rounded-xl hover:bg-clay-dark transition-colors"
                        >
                            Passer la commande
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}