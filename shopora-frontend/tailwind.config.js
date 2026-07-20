/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            // Palette ShopOra : voir le plan de design ci-dessus pour la justification
            // de chaque couleur. On étend le thème Tailwind par défaut (on ne le
            // remplace pas), donc les couleurs neutres habituelles restent disponibles.
            colors: {
                quartz: '#E8C9C5',        // rose poudré principal
                'quartz-light': '#F5E8E6', // variante claire pour fonds de section
                clay: '#C98C82',          // accent profond — boutons et CTA
                'clay-dark': '#A86F66',   // état hover/actif du CTA
                sand: '#EDE4D3',          // beige — cartes et fonds secondaires
                linen: '#FBF8F4',         // fond général de l'application
                ink: '#2B2622',           // texte principal (noir chaud)
                'ink-light': '#6B6259',   // texte secondaire / placeholders
                moss: '#8C9A7B',          // succès (ex: session de groupe réussie)
            },
            fontFamily: {
                display: ['Fraunces', 'serif'],
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        },
    },
    plugins: [],
}