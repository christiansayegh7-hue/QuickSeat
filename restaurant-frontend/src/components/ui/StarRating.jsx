import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, size = 16, showValue = true, reviewsCount }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={size} className="fill-gold-400 text-gold-400" />
      {showValue && (
        <span className="text-sm font-semibold text-olive-900">{rating ? rating.toFixed(1) : 'New'}</span>
      )}
      {typeof reviewsCount === 'number' && (
        <span className="text-sm text-olive-600">({reviewsCount} Reviews)</span>
      )}
    </span>
  )
}
