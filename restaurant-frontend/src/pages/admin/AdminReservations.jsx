import { useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../../lib/api'
import { formatCurrency, formatDate, formatTime, statusStyles } from '../../utils/format'

const STATUS_FILTERS = ['All', 'confirmed', 'pending', 'cancelled', 'no_show']

export default function AdminReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [busyId, setBusyId] = useState(null)

  function fetchReservations() {
    return api
      .get('/reservations')
      .then(({ data }) => setReservations(data.reservations || []))
      .finally(() => setLoading(false))
  }

  function reload() {
    setLoading(true)
    fetchReservations()
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const filtered = useMemo(
    () => (filter === 'All' ? reservations : reservations.filter((r) => r.status === filter)),
    [reservations, filter]
  )

  async function cancel(r) {
    setError('')
    setBusyId(r.id)
    try {
      await api.patch(`/reservations/${r.id}/cancel`)
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not cancel this reservation.'))
    } finally {
      setBusyId(null)
    }
  }

  async function markNoShow(r) {
    setError('')
    setBusyId(r.id)
    try {
      await api.patch(`/reservations/${r.id}/no-show`)
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this reservation.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-olive-950">Reservations</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                filter === s ? 'bg-olive-800 text-white' : 'bg-white text-olive-700 ring-1 ring-olive-200'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive-50">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-olive-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-olive-400">No reservations found.</td></tr>
            ) : (
              filtered.map((r) => {
                const status = statusStyles(r.status)
                const canAct = r.status === 'confirmed' || r.status === 'pending'
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-olive-900">{r.user?.name}</td>
                    <td className="px-4 py-3 text-olive-700">{r.restaurant?.name}</td>
                    <td className="px-4 py-3 text-olive-700">{formatDate(r.reservation_date)}</td>
                    <td className="px-4 py-3 text-olive-700">{formatTime(r.start_time)}</td>
                    <td className="px-4 py-3 text-olive-700">{r.number_of_guests}</td>
                    <td className="px-4 py-3 text-olive-700">
                      {r.items?.length > 0 ? (
                        <span
                          title={r.items.map((row) => `${row.quantity} × ${row.menu_item?.name}`).join('\n')}
                          className="cursor-help underline decoration-dotted underline-offset-2"
                        >
                          {r.items.reduce((n, row) => n + row.quantity, 0)} item(s) ·{' '}
                          {formatCurrency(r.items.reduce((sum, row) => sum + Number(row.subtotal), 0))}
                        </span>
                      ) : (
                        <span className="text-olive-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canAct && (
                        <div className="flex gap-2">
                          <button
                            disabled={busyId === r.id}
                            onClick={() => markNoShow(r)}
                            className="rounded-full border border-olive-200 px-3 py-1 text-xs font-semibold text-olive-700 hover:bg-olive-50 disabled:opacity-50"
                          >
                            No-show
                          </button>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => cancel(r)}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
