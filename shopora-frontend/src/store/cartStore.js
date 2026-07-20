import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store Zustand du panier.
 * Persiste dans localStorage -> le panier survit au rechargement de page.
 * Chaque article contient : id, productId, name, imageUrl, price, vendorEmail, quantity.
 */
export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            // Ajoute un article ou incrémente sa quantité s'il existe déjà
            addItem: (item) => {
                const existing = get().items.find(i => i.id === item.id)
                if (existing) {
                    set({
                        items: get().items.map(i =>
                            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        )
                    })
                } else {
                    set({ items: [...get().items, { ...item, quantity: 1 }] })
                }
            },

            removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    set({ items: get().items.filter(i => i.id !== id) })
                } else {
                    set({ items: get().items.map(i => i.id === id ? { ...i, quantity } : i) })
                }
            },

            clearCart: () => set({ items: [] }),

            // Calculs dérivés
            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }),
        { name: 'shopora-cart' }
    )
)