import { Sparkles, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button'

function AssistantShowcase() {
    const navigate = useNavigate()

    return (
        <section className="px-4 py-14 sm:px-8">
            <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-10 items-center">
                <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-clay bg-quartz-light px-3 py-1 rounded-full">
            <Sparkles size={12} /> Assistant IA
          </span>
                    <h2 className="font-display text-3xl text-ink mt-3">Votre conseiller shopping personnel.</h2>
                    <p className="text-ink-light mt-3 max-w-sm">
                        Décrivez ce que vous cherchez en langage naturel — l'assistant ShopOra
                        trouve les produits qui vous correspondent.
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => navigate('/assistant')}>
                            Essayer maintenant <ArrowRight size={16} className="inline ml-1" />
                        </Button>
                    </div>
                </div>

                <div className="bg-quartz-light rounded-2xl p-5 space-y-3">
                    <div className="bg-clay text-linen text-sm rounded-2xl rounded-br-sm px-4 py-2.5 ml-auto max-w-[85%]">
                        Je cherche un cadeau beauté élégant à moins de 400 MAD.
                    </div>
                    <div className="bg-linen text-ink text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[90%]">
                        Voici une idée pertinente trouvée dans le catalogue ✨
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AssistantShowcase