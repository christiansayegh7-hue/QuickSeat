import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { averageRating, restaurantImage } from '../../utils/format'
import StarRating from '../../components/ui/StarRating'

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/restaurants')
      .then(({ data }) => setRestaurants(data.restaurants || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-olive-500">Loading restaurants...</p>

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-olive-950">Restaurants</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
            <div className="relative">
              <img src={restaurantImage(r.id)} alt={r.name} className="h-32 w-full object-cover" />
              {r.is_full && (
                <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                  Full
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="font-semibold text-olive-950">{r.name}</p>
              <p className="text-xs text-olive-500">
                {r.restaurant_type} • {r.tables?.length || 0} tables • {r.available_tables_now ?? '—'} available now
              </p>
              <div className="mt-2">
                <StarRating rating={averageRating(r.reviews) || 0} reviewsCount={r.reviews?.length || 0} />
              </div>
              <div className="mt-3 flex gap-2">
                <Link to={`/restaurants/${r.id}`} className="flex-1 rounded-full border border-olive-200 py-1.5 text-center text-xs font-semibold text-olive-800 hover:bg-olive-50">
                  View
                </Link>
                <Link to={`/admin/profits?restaurant_id=${r.id}`} className="flex-1 rounded-full bg-olive-800 py-1.5 text-center text-xs font-semibold text-white hover:bg-olive-900">
                  Profits
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
