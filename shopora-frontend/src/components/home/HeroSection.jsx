import { useState } from 'react'
import { Sparkles, ArrowRight, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button'

/**
 * Le badge flottant n'est PAS branché en WebSocket temps réel : un visiteur
 * anonyme du Home n'a pas de token JWT, donc le handshake WebSocket serait
 * rejeté par JwtHandshakeInterceptor. On affiche un instantané REST chargé
 * une seule fois -> suffisant pour un aperçu marketing, sans faille de sécurité.
 */
function HeroSection({ featuredSession }) {
    const navigate = useNavigate()
    const [imgError, setImgError] = useState(false)

    return (
        <section className="relative bg-gradient-to-br from-quartz-light via-linen to-linen px-4 pt-10 pb-16 sm:px-8 sm:pt-16">
            <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-10 items-center">
                <div>
          <span className="inline-flex items-center gap-2 bg-linen border border-sand rounded-full px-4 py-1.5 text-xs font-medium text-ink-light mb-6">
            <Sparkles size={14} className="text-clay" />
            Marketplace social & intelligent
          </span>

                    <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight">
                        Achetez ensemble,
                        <br />
                        <span className="text-clay">économisez plus.</span>
                    </h1>

                    <p className="text-ink-light mt-5 max-w-sm">
                        Rejoignez des groupes d'achat et profitez de réductions exclusives,
                        guidés par votre assistant IA personnel.
                    </p>

                    <div className="flex flex-wrap gap-3 mt-7">
                        <Button onClick={() => navigate('/group-buying')}>
                            Explorer les groupes <ArrowRight size={16} className="inline ml-1" />
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/assistant')}>
                            <Bot size={16} className="inline mr-1" /> Parler à l'IA
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-sand">
                        {!imgError && (
                            <img
                                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80"
                                alt="Sélection de produits ShopOra"
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>

                    {featuredSession && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-linen rounded-2xl shadow-lg border border-sand p-4 w-44 sm:w-56">
                            <p className="text-xs text-ink-light flex items-center gap-1.5 mb-2">
                                <span className="w-2 h-2 rounded-full bg-moss" />
                                {featuredSession.currentParticipants}/{featuredSession.targetParticipants} ont rejoint
                            </p>
                            <p className="font-medium text-ink text-sm truncate">{featuredSession.productName}</p>
                            <p className="font-mono text-clay font-semibold mt-1 text-sm">
                                {featuredSession.groupPrice} MAD
                                {featuredSession.originalPrice && (
                                    <span className="text-ink-light line-through font-normal ml-2 text-xs">
                    {featuredSession.originalPrice} MAD
                  </span>
                                )}
                            </p>
                            <div className="w-full h-1.5 bg-sand rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-clay"
                                    style={{
                                        width: `${Math.min((featuredSession.currentParticipants / featuredSession.targetParticipants) * 100, 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default HeroSection