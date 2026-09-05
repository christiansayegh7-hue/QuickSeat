import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronLeft, Minus, Plus, Users } from 'lucide-react'
import api, { apiErrorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Calendar from '../components/ui/Calendar'
import { addHours, formatDate, formatTime } from '../utils/format'

const STEPS = ['Date & Time', 'Select Table', 'Your Details', 'Confirm']
const TIME_SLOTS = ['17:00', '18:00', '19:00', '20:00', '21:00']

export default function Booking() {
  const { id } = useParams()
  const { user } = useAuth()

  const [restaurant, setRestaurant] = useState(null)
  const [step, setStep] = useState(0)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState(2)
  const [tables, setTables] = useState([])
  const [tablesLoading, setTablesLoading] = useState(false)
  const [tableId, setTableId] = useState(null)
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  useEffect(() => {
    api.get(`/restaurants/${id}`).then(({ data }) => setRestaurant(data.restaurant))
  }, [id])

  const endTime = time ? addHours(time, 2) : ''

  function goToTableStep() {
    if (!date || !time) {
      setError('Please choose a date and time.')
      return
    }
    setError('')
    setStep(1)
    setTablesLoading(true)
    setTableId(null)
    api
      .get(`/restaurants/${id}/available-tables`, {
        params: { reservation_date: date, start_time: time, end_time: endTime, number_of_guests: guests },
      })
      .then(({ data }) => setTables(data.available_tables || []))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load available tables.')))
      .finally(() => setTablesLoading(false))
  }

  async function confirmReservation() {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/reservations', {
        user_id: user.id,
        restaurant_id: Number(id),
        table_id: tableId,
        reservation_date: date,
        start_time: time,
        end_time: endTime,
        number_of_guests: guests,
        reservation_method: 'website',
        notes: notes || null,
      })
      setConfirmed(data.reservation)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not complete your reservation.'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTable = tables.find((t) => t.id === tableId)

  if (!restaurant) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-olive-500">Loading...</div>
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-olive-100 text-olive-700">
          <Check size={32} />
        </span>
        <h1 className="font-serif text-2xl font-bold text-olive-950">Reservation Confirmed!</h1>
        <p className="mt-2 text-olive-600">
          Your table at {restaurant.name} is booked. Confirmation code:{' '}
          <span className="font-semibold text-olive-900">{confirmed.reservation_code}</span>
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/my-bookings" className="rounded-full bg-olive-800 px-6 py-3 text-sm font-semibold text-white hover:bg-olive-900">
            View My Bookings
          </Link>
          <Link to="/restaurants" className="rounded-full border border-olive-300 px-6 py-3 text-sm font-semibold text-olive-800 hover:bg-olive-50">
            Explore More
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to={`/restaurants/${id}`} className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-olive-600 hover:text-olive-900">
        <ChevronLeft size={16} /> Back to {restaurant.name}
      </Link>

      <div className="rounded-2xl bg-olive-900 p-6 text-white">
        <h1 className="font-serif text-xl font-bold">Book a Table</h1>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-olive-200">
          {STEPS.map((label, i) => (
            <span key={label} className={`flex items-center gap-2 ${i <= step ? 'text-white' : ''}`}>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  i <= step ? 'bg-olive-500 text-white' : 'bg-olive-700 text-olive-300'
                }`}
              >
                {i + 1}
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {step === 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Calendar selected={date} onSelect={setDate} />
            <div>
              <p className="mb-2 text-sm font-semibold text-olive-900">Time</p>
              <div className="mb-6 flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setTime(slot)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      time === slot ? 'bg-olive-800 text-white' : 'bg-olive-50 text-olive-700 hover:bg-olive-100'
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
              <p className="mb-2 text-sm font-semibold text-olive-900">Number of Guests</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-100 text-olive-800 hover:bg-olive-200"
                >
                  <Minus size={16} />
                </button>
                <span className="flex items-center gap-2 text-lg font-semibold text-olive-950">
                  <Users size={18} /> {guests}
                </span>
                <button
                  onClick={() => setGuests((g) => g + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-100 text-olive-800 hover:bg-olive-200"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-1 text-sm text-olive-600">
              Available Tables · Capacity: {guests} {guests === 1 ? 'Guest' : 'Guests'}
            </p>
            {tablesLoading ? (
              <p className="py-10 text-center text-olive-500">Searching for available tables...</p>
            ) : tables.length === 0 ? (
              <p className="py-10 text-center text-olive-500">No tables available for this time. Try a different slot.</p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTableId(t.id)}
                    className={`rounded-xl border-2 px-3 py-4 text-center transition ${
                      tableId === t.id ? 'border-olive-800 bg-olive-50' : 'border-olive-100 hover:border-olive-300'
                    }`}
                  >
                    <p className="font-semibold text-olive-950">T{t.table_number}</p>
                    <p className="text-xs text-olive-500">{t.capacity} People</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Full Name</label>
              <input readOnly value={user?.name || ''} className="w-full rounded-lg border border-olive-200 bg-olive-50 px-3 py-2 text-sm text-olive-800" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Email</label>
              <input readOnly value={user?.email || ''} className="w-full rounded-lg border border-olive-200 bg-olive-50 px-3 py-2 text-sm text-olive-800" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Special Request (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. no onions, window seat..."
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="mb-4 font-serif text-lg font-bold text-olive-950">Confirm Reservation</h3>
            <dl className="space-y-3 text-sm">
              <Row label="Restaurant" value={restaurant.name} />
              <Row label="Address" value={restaurant.address} />
              <Row label="Date" value={formatDate(date)} />
              <Row label="Time" value={`${formatTime(time)} - ${formatTime(endTime)}`} />
              <Row label="Table" value={selectedTable ? `T${selectedTable.table_number} (${selectedTable.capacity} people)` : '—'} />
              <Row label="Guests" value={guests} />
              {notes && <Row label="Special Request" value={notes} />}
            </dl>
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-olive-100 pt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full border border-olive-200 px-5 py-2.5 text-sm font-semibold text-olive-700 disabled:opacity-0"
          >
            Back
          </button>

          {step === 0 && (
            <button onClick={goToTableStep} className="rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
              Next
            </button>
          )}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!tableId}
              className="rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-50"
            >
              Next
            </button>
          )}
          {step === 2 && (
            <button onClick={() => setStep(3)} className="rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
              Next
            </button>
          )}
          {step === 3 && (
            <button
              onClick={confirmReservation}
              disabled={submitting}
              className="rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
            >
              {submitting ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-olive-50 pb-2">
      <dt className="text-olive-500">{label}</dt>
      <dd className="text-right font-medium text-olive-900">{value}</dd>
    </div>
  )
}
