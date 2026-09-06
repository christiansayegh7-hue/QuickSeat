import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX2, MapPin } from 'lucide-react'
import api, { apiErrorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatTime, statusStyles } from '../utils/format'

export default function MyBookings() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  function reload() {
    setLoading(true)
    fetchReservations()
  }

  function fetchReservations() {
    return api
      .get('/reservations/my')
      .then(({ data }) => setReservations(data.reservations || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user) fetchReservations()
  }, [user])

  async function cancelReservation(id) {
    setError('')
    setCancellingId(id)
    try {
      await api.patch(`/reservations/${id}/cancel`)
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not cancel this reservation.'))
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-bold text-olive-950">My Bookings</h1>
      <p className="mt-1 text-olive-600">View and manage your upcoming reservations.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-olive-100" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-olive-100">
          <CalendarX2 className="mx-auto mb-3 text-olive-300" size={36} />
          <p className="text-olive-600">You don't have any reservations yet.</p>
          <Link to="/restaurants" className="mt-4 inline-block rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
            Book a Table
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {reservations.map((r) => {
            const status = statusStyles(r.status)
            const canCancel = r.status === 'confirmed' || r.status === 'pending'
            return (
              <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-olive-950">{r.restaurant?.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-olive-500">
                      <MapPin size={12} /> {r.restaurant?.address}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-olive-700 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-olive-400">Date</p>
                    {formatDate(r.reservation_date)}
                  </div>
                  <div>
                    <p className="text-xs text-olive-400">Time</p>
                    {formatTime(r.start_time)}
                  </div>
                  <div>
                    <p className="text-xs text-olive-400">Guests</p>
                    {r.number_of_guests}
                  </div>
                  <div>
                    <p className="text-xs text-olive-400">Table</p>
                    {r.table ? `T${r.table.table_number}` : '—'}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-olive-50 pt-3">
                  <p className="text-xs text-olive-400">Code: {r.reservation_code}</p>
                  {canCancel && (
                    <button
                      onClick={() => cancelReservation(r.id)}
                      disabled={cancellingId === r.id}
                      className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {cancellingId === r.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
