import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Upload, X } from 'lucide-react'
import api, { apiErrorMessage } from '../../lib/api'
import { averageRating, restaurantCoverUrl } from '../../utils/format'
import StarRating from '../../components/ui/StarRating'

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  function fetchRestaurants() {
    return api
      .get('/restaurants')
      .then(({ data }) => setRestaurants(data.restaurants || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  function handleSaved(updated) {
    setRestaurants((list) => list.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
    setEditing(null)
  }

  if (loading) return <p className="text-olive-500">Loading restaurants...</p>

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-olive-950">Restaurants</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-olive-100">
            <div className="relative">
              <img src={restaurantCoverUrl(r)} alt={r.name} className="h-32 w-full object-cover" />
              {r.is_full && (
                <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                  Full
                </span>
              )}
              <button
                onClick={() => setEditing(r)}
                className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-olive-800 shadow hover:bg-white"
              >
                <Pencil size={12} /> Edit
              </button>
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

      {editing && <EditRestaurantModal restaurant={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  )
}

function EditRestaurantModal({ restaurant, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: restaurant.name || '',
    phone: restaurant.phone || '',
    address: restaurant.address || '',
    restaurant_type: restaurant.restaurant_type || '',
    price_range: restaurant.price_range || '',
    opening_hours: restaurant.opening_hours || '',
    description: restaurant.description || '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(restaurantCoverUrl(restaurant))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, value ?? ''))
    if (imageFile) body.append('image', imageFile)

    try {
      const { data } = await api.post(`/admin/restaurants/${restaurant.id}`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onSaved(data.restaurant)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save changes.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-olive-950">Edit Restaurant</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-olive-500 hover:bg-olive-50">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium text-olive-600">Cover Photo</p>
            <div className="flex items-center gap-4">
              <img src={previewUrl} alt="" className="h-16 w-24 rounded-lg object-cover ring-1 ring-olive-100" />
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-olive-200 px-4 py-2 text-xs font-semibold text-olive-800 hover:bg-olive-50">
                <Upload size={14} /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              </label>
            </div>
          </div>

          <Field label="Name">
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cuisine Type">
              <input value={form.restaurant_type} onChange={(e) => update('restaurant_type', e.target.value)} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
            </Field>
            <Field label="Price Range">
              <input value={form.price_range} onChange={(e) => update('price_range', e.target.value)} placeholder="$$" className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
            </Field>
          </div>

          <Field label="Address">
            <input value={form.address} onChange={(e) => update('address', e.target.value)} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
            </Field>
            <Field label="Opening Hours">
              <input value={form.opening_hours} onChange={(e) => update('opening_hours', e.target.value)} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
            </Field>
          </div>

          <Field label="About / Description">
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-olive-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-full border border-olive-200 px-5 py-2 text-sm font-semibold text-olive-700">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-full bg-olive-800 px-6 py-2 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-olive-600">{label}</label>
      {children}
    </div>
  )
}
