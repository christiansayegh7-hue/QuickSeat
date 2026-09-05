import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import api, { apiErrorMessage } from '../../lib/api'
import { formatCurrency } from '../../utils/format'

const emptyForm = { id: null, category_id: '', name: '', description: '', price: '', image: '', is_available: true }

export default function AdminMenuItems() {
  const [restaurants, setRestaurants] = useState([])
  const [restaurantId, setRestaurantId] = useState('')
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/restaurants').then(({ data }) => {
      const list = data.restaurants || []
      setRestaurants(list)
      if (list.length) setRestaurantId(String(list[0].id))
    })
  }, [])

  function fetchRestaurant(id) {
    if (!id) return Promise.resolve()
    return api
      .get(`/restaurants/${id}`)
      .then(({ data }) => setRestaurant(data.restaurant))
      .finally(() => setLoading(false))
  }

  function reloadRestaurant(id) {
    setLoading(true)
    fetchRestaurant(id)
  }

  useEffect(() => {
    fetchRestaurant(restaurantId)
  }, [restaurantId])

  const categories = restaurant?.categories || []

  function openCreate() {
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' })
    setShowForm(true)
    setError('')
  }

  function openEdit(item, categoryId) {
    setForm({
      id: item.id,
      category_id: categoryId,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image: item.image || '',
      is_available: !!item.is_available,
    })
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      category_id: Number(form.category_id),
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      image: form.image || null,
      is_available: form.is_available,
    }
    try {
      if (form.id) {
        await api.patch(`/menu-items/${form.id}`, payload)
      } else {
        await api.post('/menu-items', payload)
      }
      setShowForm(false)
      reloadRestaurant(restaurantId)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save this menu item.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this menu item?')) return
    try {
      await api.delete(`/menu-items/${id}`)
      reloadRestaurant(restaurantId)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this menu item.'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-xl font-bold text-olive-950">Menu Items</h2>
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
        <button
          onClick={openCreate}
          disabled={!categories.length}
          className="flex items-center gap-1 rounded-full bg-olive-800 px-4 py-2 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-50"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-olive-500">Loading menu...</p>
      ) : categories.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-olive-500 ring-1 ring-olive-100">This restaurant has no categories yet.</p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="mb-3 font-semibold text-olive-900">{category.name}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(category.menuItems || []).map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-olive-100">
                    {item.image && <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-olive-950">{item.name}</p>
                        <p className="text-sm font-semibold text-olive-700">{formatCurrency(item.price)}</p>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-olive-500">{item.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                          {item.is_available ? 'Available' : 'Hidden'}
                        </span>
                        <button onClick={() => openEdit(item, category.id)} className="ml-auto rounded-full p-1.5 text-olive-600 hover:bg-olive-100">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="rounded-full p-1.5 text-red-500 hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {(category.menuItems || []).length === 0 && (
                  <p className="text-sm text-olive-400">No items in this category.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-olive-950">{form.id ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={() => setShowForm(false)} className="text-olive-500 hover:text-olive-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Category</label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Name</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-olive-600">Price</label>
                  <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input id="avail" type="checkbox" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} />
                  <label htmlFor="avail" className="text-sm text-olive-700">Available</label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Image URL</label>
                <input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm" />
              </div>
              <button type="submit" disabled={saving} className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
