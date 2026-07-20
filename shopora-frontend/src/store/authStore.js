import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            userId: null,
            fullName: null,
            email: null,
            role: null,
            isAuthenticated: false,
            // Nouveau champ : photo de profil en base64
            avatarUrl: null,

            login: (authResponse) =>
                set({
                    token: authResponse.token,
                    userId: authResponse.userId,
                    fullName: authResponse.fullName,
                    email: authResponse.email,
                    role: authResponse.role,
                    isAuthenticated: true,
                }),

            logout: () =>
                set({
                    token: null,
                    userId: null,
                    fullName: null,
                    email: null,
                    role: null,
                    isAuthenticated: false,
                    avatarUrl: null,
                }),

            // Met à jour les infos du profil (nom, email, avatar...)
            updateProfile: (data) => set((state) => ({ ...state, ...data })),
        }),
        { name: 'shopora-auth' }
    )
)