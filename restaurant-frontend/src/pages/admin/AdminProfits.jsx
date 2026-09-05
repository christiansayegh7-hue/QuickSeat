import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { apiErrorMessage } from '../../lib/api'
import { formatCurrency } from '../../utils/format'

function firstOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function AdminProfits() {
  const [searchParams] = useSearchParams()
  const [restaurants, setRestaurants] = useState([])
  const [restaurantId, setRestaurantId] = useState(searchParams.get('restaurant_id') || '')
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/restaurants').then(({ data }) => {
      const list = data.restaurants || []
      setRestaurants(list)
      if (!restaurantId && list.length) setRestaurantId(String(list[0].id))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function runQuery() {
    if (!restaurantId) return Promise.resolve()
    return api
      .get(`/admin/restaurants/${restaurantId}/profits`, { params: { from, to } })
      .then(({ data }) => setResult(data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not calculate profit for this period.')))
      .finally(() => setLoading(false))
  }

  function fetchProfit(e) {
    e?.preventDefault()
    if (!restaurantId) return
    setLoading(true)
    setError('')
    runQuery()
  }

  useEffect(() => {
    if (restaurantId) runQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl font-bold text-olive-950">Profits</h2>

      <form onSubmit={fetchProfit} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100">
        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">Restaurant</label>
          <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm">
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-olive-600">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-olive-200 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-full bg-olive-800 px-5 py-2 text-sm font-semibold text-white hover:bg-olive-900">
          Calculate
        </button>
      </form>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-olive-500">Calculating...</p>
      ) : result ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
            <p className="text-sm text-olive-500">Total Profit</p>
            <p className="mt-1 font-serif text-3xl font-bold text-olive-950">{formatCurrency(result.total_profit)}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
            <p className="text-sm text-olive-500">Confirmed Reservations</p>
            <p className="mt-1 font-serif text-3xl font-bold text-olive-950">{result.confirmed_reservations_count}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
