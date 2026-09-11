import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, UtensilsCrossed, X } from 'lucide-react'
import api, { apiErrorMessage } from '../../lib/api'
import { formatCurrency, formatDate, formatTime, menuItemImageUrl, statusStyles } from '../../utils/format'

const STATUS_FILTERS = ['All', 'confirmed', 'pending', 'cancelled', 'no_show']

export default function ManagerReservations() {
  const [reservations, setReservations] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  const [activeReservation, setActiveReservation] = useState(null)
  const [cart, setCart] = useState({})
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  function fetchData() {
    return Promise.all([api.get('/manager/reservations'), api.get('/manager/restaurant')])
      .then(([reservationsRes, restaurantRes]) => {
        setReservations(reservationsRes.data.reservations || [])
        setCategories(restaurantRes.data.restaurant?.categories || [])
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your reservations.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(
    () => (filter === 'All' ? reservations : reservations.filter((r) => r.status === filter)),
    [reservations, filter]
  )

  function openAddDishes(reservation) {
    setActiveReservation(reservation)
    setCart({})
    setModalError('')
  }

  function setQuantity(itemId, quantity) {
    setCart((c) => ({ ...c, [itemId]: Math.max(0, quantity) }))
  }

  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0)

  async function handleAddDishes(e) {
    e.preventDefault()
    if (cartEntries.length === 0) {
      setModalError('Select at least one dish.')
      return
    }

    setSaving(true)
    setModalError('')
    try {
      await api.post(`/reservations/${activeReservation.id}/items`, {
        items: cartEntries.map(([menuItemId, quantity]) => ({ menu_item_id: Number(menuItemId), quantity })),
      })
      setActiveReservation(null)
      fetchData()
    } catch (err) {
      setModalError(apiErrorMessage(err, 'Could not add these dishes.'))
    } finally {
      setSaving(false)
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-olive-100 text-xs uppercase tracking-wide text-olive-400">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Table</th>
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
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-olive-900">{r.user?.name}</p>
                      <p className="text-xs text-olive-400">{r.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-olive-700">{formatDate(r.reservation_date)}</td>
                    <td className="px-4 py-3 text-olive-700">{formatTime(r.start_time)} - {formatTime(r.end_time)}</td>
                    <td className="px-4 py-3 text-olive-700">{r.number_of_guests}</td>
                    <td className="px-4 py-3 text-olive-700">{r.table ? `T${r.table.table_number}` : '—'}</td>
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
                      {r.status !== 'cancelled' && (
                        <button
                          onClick={() => openAddDishes(r)}
                          className="flex items-center gap-1 rounded-full border border-olive-200 px-3 py-1.5 text-xs font-semibold text-olive-800 hover:bg-olive-50"
                        >
                          <UtensilsCrossed size={13} /> Add Dishes
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {activeReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-olive-950">Add Dishes</h3>
                <p className="text-xs text-olive-500">
                  {activeReservation.user?.name} · {formatDate(activeReservation.reservation_date)} · T{activeReservation.table?.table_number}
                </p>
              </div>
              <button onClick={() => setActiveReservation(null)} className="text-olive-500 hover:text-olive-900">
                <X size={20} />
              </button>
            </div>

            {modalError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{modalError}</p>}

            {categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-olive-500">Your restaurant has no menu items yet.</p>
            ) : (
              <form onSubmit={handleAddDishes} className="space-y-5">
                <div className="max-h-96 space-y-5 overflow-y-auto pr-1">
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
                                    type="button"
                                    onClick={() => setQuantity(item.id, 1)}
                                    className="flex items-center gap-1 rounded-full bg-olive-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-olive-900"
                                  >
                                    <Plus size={12} /> Add
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setQuantity(item.id, qty - 1)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-olive-100 text-olive-800 hover:bg-olive-200"
                                    >
                                      <Minus size={13} />
                                    </button>
                                    <span className="w-4 text-center text-sm font-semibold text-olive-950">{qty}</span>
                                    <button
                                      type="button"
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

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Add to Reservation'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
