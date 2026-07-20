import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    // Corrige "global is not defined", causé par sockjs-client qui suppose
    // l'existence de la variable "global" de Node.js, absente nativement
    // dans le navigateur. On la fait simplement pointer vers globalThis,
    // l'équivalent universel reconnu par tous les environnements JS modernes.
    define: {
        global: 'globalThis',
    },
    server: {
        port: 5173,
    },
})