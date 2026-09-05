import { useEffect, useState } from 'react'
import api from '../../lib/api'
import StarRating from '../../components/ui/StarRating'

export default function AdminReviews() {
  const [restaurants, setRestaurants] = useState([])
  const [restaurantId, setRestaurantId] = useState('')
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/restaurants').then(({ data }) => {
      const list = data.restaurants || []
      setRestaurants(list)
      if (list.length) setRestaurantId(String(list[0].id))
    })
  }, [])

  useEffect(() => {
    if (!restaurantId) return
    api
      .get(`/restaurants/${restaurantId}/reviews`)
      .then(({ data }) => setReviews(data.reviews || []))
      .finally(() => setLoading(false))
  }, [restaurantId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-xl font-bold text-olive-950">Reviews</h2>
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="rounded-lg border border-olive-200 px-3 py-1.5 text-sm"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-olive-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-olive-500 ring-1 ring-olive-100">No reviews for this restaurant yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {reviews.map((review) => {
            const avg = (review.rating_food + review.rating_service + review.rating_cleanliness) / 3
            return (
              <div key={review.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-olive-100">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-olive-950">{review.user?.name || 'Guest'}</p>
                  <StarRating rating={avg} />
                </div>
                <div className="mt-2 flex gap-3 text-xs text-olive-500">
                  <span>Food: {review.rating_food}</span>
                  <span>Service: {review.rating_service}</span>
                  <span>Cleanliness: {review.rating_cleanliness}</span>
                </div>
                {review.comment && <p className="mt-2 text-sm text-olive-600">{review.comment}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
