import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronLeft, Minus, Plus, Users, UtensilsCrossed } from 'lucide-react'
import api, { apiErrorMessage } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Calendar from '../components/ui/Calendar'
import { addMinutes, formatCurrency, formatDate, formatDuration, formatTime, menuItemImageUrl } from '../utils/format'

const STEPS = ['Reservation Details', 'Menu', 'Confirm']
const DURATIONS = [60, 90, 120, 180, 240]

export default function Booking() {
  const { id } = useParams()
  const { user, isManager } = useAuth()

  const [restaurant, setRestaurant] = useState(null)
  const [step, setStep] = useState(0)

  const [date, setDate] = useState('')
  const [guests, setGuests] = useState(2)
  const [duration, setDuration] = useState(120)
  const [time, setTime] = useState('')
  const [tableId, setTableId] = useState(null)
  const [cart, setCart] = useState({})
  const [notes, setNotes] = useState('')

  const [startTimes, setStartTimes] = useState([])
  const [startTimesLoading, setStartTimesLoading] = useState(false)
  const [tables, setTables] = useState([])
  const [tablesLoading, setTablesLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  useEffect(() => {
    api.get(`/restaurants/${id}`).then(({ data }) => setRestaurant(data.restaurant))
  }, [id])

  const maxGuests = restaurant?.max_capacity || null
  const endTime = time ? addMinutes(time, duration) : ''

  // Triggered directly from the date/guests/duration controls below (not a
  // reactive effect) - a fresh start-time list only ever needs to be fetched
  // in direct response to one of those three actually changing.
  function refreshStartTimes(nextDate, nextGuests, nextDuration) {
    setTime('')
    setTableId(null)
    setTables([])
    if (!nextDate || !nextGuests || !nextDuration) {
      setStartTimes([])
      return
    }
    setStartTimesLoading(true)
    api
      .get(`/restaurants/${id}/available-start-times`, {
        params: { reservation_date: nextDate, duration_minutes: nextDuration, number_of_guests: nextGuests },
      })
      .then(({ data }) => setStartTimes(data.start_times || []))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load available times.')))
      .finally(() => setStartTimesLoading(false))
  }

  function selectDate(nextDate) {
    setDate(nextDate)
    refreshStartTimes(nextDate, guests, duration)
  }

  function selectDuration(mins) {
    setDuration(mins)
    refreshStartTimes(date, guests, mins)
  }

  function selectStartTime(slot) {
    setTime(slot)
    setTableId(null)
    setTablesLoading(true)
    api
      .get(`/restaurants/${id}/available-tables`, {
        params: { reservation_date: date, start_time: slot, end_time: addMinutes(slot, duration), number_of_guests: guests },
      })
      .then(({ data }) => setTables(data.available_tables || []))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load available tables.')))
      .finally(() => setTablesLoading(false))
  }

  const categories = restaurant?.categories || []
  const menuItemsById = new Map()
  categories.forEach((c) => (c.menu_items || []).forEach((item) => menuItemsById.set(item.id, item)))

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([itemId, qty]) => ({ item: menuItemsById.get(Number(itemId)), quantity: qty }))
    .filter((row) => row.item)

  const cartTotal = cartItems.reduce((sum, row) => sum + Number(row.item.price) * row.quantity, 0)

  function setQuantity(itemId, quantity) {
    setCart((c) => ({ ...c, [itemId]: Math.max(0, quantity) }))
  }

  function adjustGuests(delta) {
    const next = Math.max(1, Math.min(maxGuests || Infinity, guests + delta))
    if (next === guests) return
    setGuests(next)
    refreshStartTimes(date, next, duration)
  }

  async function confirmReservation() {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/reservations', {
        restaurant_id: Number(id),
        table_id: tableId,
        reservation_date: date,
        start_time: time,
        end_time: endTime,
        number_of_guests: guests,
        reservation_method: 'website',
        notes: notes || null,
        items: cartItems.length
          ? cartItems.map((row) => ({ menu_item_id: row.item.id, quantity: row.quantity }))
          : undefined,
      })
      setConfirmed(data.reservation)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not complete your reservation.'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTable = tables.find((t) => t.id === tableId)
  const detailsComplete = Boolean(date && time && tableId)

  if (!restaurant) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-olive-500">Loading...</div>
  }

  if (isManager && user?.managed_restaurants?.[0]?.id !== restaurant.id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-xl font-bold text-olive-950">Booking Not Available</h1>
        <p className="mt-2 text-olive-600">
          Restaurant accounts can only make reservations at their own restaurant.
        </p>
        <Link to={`/restaurants/${id}`} className="mt-6 inline-block rounded-full bg-olive-800 px-6 py-3 text-sm font-semibold text-white hover:bg-olive-900">
          Back to {restaurant.name}
        </Link>
      </div>
    )
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
        {confirmed.items?.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-olive-100">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-olive-500">Pre-ordered Items</p>
            {confirmed.items.map((row) => (
              <div key={row.id} className="flex justify-between py-1 text-sm text-olive-700">
                <span>{row.quantity} × {row.menu_item?.name}</span>
                <span>{formatCurrency(row.subtotal)}</span>
              </div>
            ))}
          </div>
        )}
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Calendar selected={date} onSelect={selectDate} />

            <div className="space-y-6">
              <div>
                <p className="mb-2 flex items-baseline justify-between text-sm font-semibold text-olive-900">
                  Number of Guests
                  {maxGuests && <span className="text-xs font-normal text-olive-400">Max {maxGuests} guests</span>}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => adjustGuests(-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-100 text-olive-800 hover:bg-olive-200"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="flex items-center gap-2 text-lg font-semibold text-olive-950">
                    <Users size={18} /> {guests}
                  </span>
                  <button
                    onClick={() => adjustGuests(1)}
                    disabled={maxGuests ? guests >= maxGuests : false}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-olive-100 text-olive-800 hover:bg-olive-200 disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-olive-900">Duration</p>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((mins) => (
                    <button
                      key={mins}
                      onClick={() => selectDuration(mins)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        duration === mins ? 'bg-olive-800 text-white' : 'bg-olive-50 text-olive-700 hover:bg-olive-100'
                      }`}
                    >
                      {formatDuration(mins)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-olive-900">Start Time</p>
                {!date ? (
                  <p className="text-sm text-olive-400">Choose a date first.</p>
                ) : startTimesLoading ? (
                  <p className="text-sm text-olive-400">Checking availability...</p>
                ) : startTimes.length === 0 ? (
                  <p className="text-sm text-olive-400">No times available for this date, guest count and duration. Try a shorter duration or another date.</p>
                ) : (
                  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                    {startTimes.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => selectStartTime(slot)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          time === slot ? 'bg-olive-800 text-white' : 'bg-olive-50 text-olive-700 hover:bg-olive-100'
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {time && (
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-semibold text-olive-900">
                  Table · {formatTime(time)} - {formatTime(endTime)}
                </p>
                {tablesLoading ? (
                  <p className="py-6 text-center text-olive-500">Searching for available tables...</p>
                ) : tables.length === 0 ? (
                  <p className="py-6 text-center text-olive-500">No tables available for this combination. Try a different time.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
                        {t.location && <p className="mt-0.5 text-[11px] text-olive-400">{t.location}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-olive-600">
                Pre-order from {restaurant.name}'s menu <span className="text-olive-400">(optional — you can also order at the table)</span>
              </p>
              {cartItems.length > 0 && (
                <span className="whitespace-nowrap rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold text-olive-800">
                  {cartItems.reduce((n, r) => n + r.quantity, 0)} item(s) · {formatCurrency(cartTotal)}
                </span>
              )}
            </div>

            {categories.length === 0 ? (
              <p className="py-10 text-center text-olive-500">This restaurant hasn't published a menu yet.</p>
            ) : (
              <div className="max-h-[28rem] space-y-6 overflow-y-auto pr-1">
                {categories.map((category) => {
                  const items = (category.menu_items || []).filter((i) => i.is_available)
                  if (items.length === 0) return null
                  return (
                    <div key={category.id}>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-olive-500">{category.name}</h4>
                      <div className="space-y-2">
                        {items.map((item) => {
                          const qty = cart[item.id] || 0
                          return (
                            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-olive-100 p-2.5">
                              <img src={menuItemImageUrl(item)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-olive-950">{item.name}</p>
                                <p className="text-xs text-olive-500">{formatCurrency(item.price)}</p>
                              </div>
                              {qty === 0 ? (
                                <button
                                  onClick={() => setQuantity(item.id, 1)}
                                  className="flex items-center gap-1 rounded-full bg-olive-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-olive-900"
                                >
                                  <Plus size={12} /> Add
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setQuantity(item.id, qty - 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-100 text-olive-800 hover:bg-olive-200"
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="w-4 text-center text-sm font-semibold text-olive-950">{qty}</span>
                                  <button
                                    onClick={() => setQuantity(item.id, qty + 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-100 text-olive-800 hover:bg-olive-200"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 font-serif text-lg font-bold text-olive-950">Confirm Reservation</h3>
              <dl className="space-y-3 text-sm">
                <Row label="Restaurant" value={restaurant.name} />
                <Row label="Address" value={restaurant.address} />
                <Row label="Date" value={formatDate(date)} />
                <Row label="Time" value={`${formatTime(time)} - ${formatTime(endTime)} (${formatDuration(duration)})`} />
                <Row label="Table" value={selectedTable ? `T${selectedTable.table_number} (${selectedTable.capacity} people)` : '—'} />
                <Row label="Guests" value={guests} />
              </dl>
            </div>

            {cartItems.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-olive-500">
                  <UtensilsCrossed size={13} /> Pre-ordered Items
                </p>
                <div className="space-y-1.5 rounded-xl bg-olive-50 p-3">
                  {cartItems.map((row) => (
                    <div key={row.item.id} className="flex justify-between text-sm text-olive-700">
                      <span>{row.quantity} × {row.item.name}</span>
                      <span>{formatCurrency(Number(row.item.price) * row.quantity)}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-olive-200 pt-1.5 text-sm font-semibold text-olive-900">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-olive-600">Full Name</label>
                  <input readOnly value={user?.name || ''} className="w-full rounded-lg border border-olive-200 bg-olive-50 px-3 py-2 text-sm text-olive-800" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-olive-600">Email</label>
                  <input readOnly value={user?.email || ''} className="w-full rounded-lg border border-olive-200 bg-olive-50 px-3 py-2 text-sm text-olive-800" />
                </div>
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
            <button
              onClick={() => setStep(1)}
              disabled={!detailsComplete}
              className="rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-50"
            >
              Next
            </button>
          )}
          {step === 1 && (
            <button onClick={() => setStep(2)} className="rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900">
              Next
            </button>
          )}
          {step === 2 && (
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
