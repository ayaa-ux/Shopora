import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Point d'entrée de la SPA. BrowserRouter englobe TOUTE l'application :
// c'est lui qui permet à React Router de gérer la navigation sans jamais
// recharger la page (vraie Single Page Application, comme prévu dans le rapport).
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
)