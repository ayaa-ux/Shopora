import { Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const placeholderTones = ['bg-quartz-light', 'bg-sand', 'bg-quartz']

function FeaturedGroupCard({ group, index }) {
    const navigate = useNavigate()
    const discountPercent = group.originalPrice
        ? Math.round((1 - group.groupPrice / group.originalPrice) * 100)
        : null
    const progress = Math.min((group.currentParticipants / group.targetParticipants) * 100, 100)

    return (
        <button
            onClick={() => navigate('/group-buying')}
            className="text-left bg-linen border border-sand rounded-2xl overflow-hidden hover:shadow-md transition-shadow w-full"
        >
            <div className={`relative aspect-[4/3] ${placeholderTones[index % placeholderTones.length]}`}>
                {group.imageUrl && (
                    <img src={group.imageUrl} alt={group.productName} className="w-full h-full object-cover" />
                )}
                {discountPercent > 0 && (
                    <span className="absolute top-3 left-3 bg-clay text-linen text-xs font-semibold px-3 py-1 rounded-full">
            -{discountPercent}% en groupe
          </span>
                )}
                {group.urgent && (
                    <span className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
            Urgent
          </span>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-display text-lg text-ink truncate">{group.productName}</h3>
                <p className="mt-1">
                    <span className="font-mono text-ink font-semibold">{group.groupPrice} MAD</span>
                    {group.originalPrice && (
                        <span className="text-ink-light line-through text-sm ml-2">{group.originalPrice} MAD</span>
                    )}
                </p>

                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-ink-light mb-1">
            <span className="flex items-center gap-1">
              <Users size={12} /> {group.currentParticipants}/{group.targetParticipants} participants
            </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-sand rounded-full overflow-hidden">
                        <div className="h-full bg-clay" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        </button>
    )
}

export default FeaturedGroupCard