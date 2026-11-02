import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Historique des commandes (persisté en localStorage).
 * Il n'existe pas d'order-service dans le backend actuel : les commandes sont
 * donc enregistrées côté navigateur, par utilisateur (userEmail).
 * Les données de carte bancaire ne sont JAMAIS stockées.
 */
export const useOrdersStore = create(
    persist(
        (set, get) => ({
            orders: [],

            addOrder: (order) => {
                const full = {
                    id: `#SO${Date.now().toString().slice(-7)}`,
                    createdAt: new Date().toISOString(),
                    status: 'Commandé',
                    ...order,
                }
                set({ orders: [full, ...get().orders] })
                return full
            },
        }),
        { name: 'shopora-orders' }
    )
)