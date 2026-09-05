import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../lib/api'
import RestaurantCard from '../components/ui/RestaurantCard'

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')

  useEffect(() => {
    api
      .get('/restaurants')
      .then(({ data }) => setRestaurants(data.restaurants || []))
      .finally(() => setLoading(false))
  }, [])

  const types = useMemo(() => {
    const set = new Set(restaurants.map((r) => r.restaurant_type).filter(Boolean))
    return ['All', ...set]
  }, [restaurants])

  const filtered = restaurants.filter((r) => {
    const matchesQuery =
      !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.address || '').toLowerCase().includes(query.toLowerCase())
    const matchesType = type === 'All' || r.restaurant_type === type
    return matchesQuery && matchesType
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-olive-950">Restaurants</h1>
        <p className="mt-1 text-olive-600">Browse our partner restaurants and find your next table.</p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or location..."
            className="w-full rounded-full border border-olive-200 bg-white py-2.5 pl-10 pr-4 text-sm text-olive-900 outline-none focus:border-olive-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                type === t ? 'bg-olive-800 text-white' : 'bg-white text-olive-700 ring-1 ring-olive-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-olive-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-olive-600 ring-1 ring-olive-100">
          No restaurants match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  )
}
