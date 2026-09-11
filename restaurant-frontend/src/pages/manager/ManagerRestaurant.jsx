import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import api, { apiErrorMessage } from '../../lib/api'
import { restaurantCoverUrl } from '../../utils/format'

const emptyTableForm = { id: null, table_number: '', capacity: '', location: '', status: 'available' }

export default function ManagerRestaurant() {
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const [tableForm, setTableForm] = useState(emptyTableForm)
  const [showTableForm, setShowTableForm] = useState(false)
  const [tableSaving, setTableSaving] = useState(false)
  const [tableError, setTableError] = useState('')

  function fetchRestaurant() {
    return api
      .get('/manager/restaurant')
      .then(({ data }) => {
        setRestaurant(data.restaurant)
        setForm({
          name: data.restaurant.name || '',
          description: data.restaurant.description || '',
          max_capacity: data.restaurant.max_capacity || '',
          opening_time: data.restaurant.opening_time || '',
          closing_time: data.restaurant.closing_time || '',
        })
        setPreviewUrl(restaurantCoverUrl(data.restaurant))
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your restaurant.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRestaurant()
  }, [])

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
    setSaveMessage('')

    const body = new FormData()
    body.append('name', form.name)
    body.append('description', form.description || '')
    body.append('max_capacity', form.max_capacity)
    body.append('opening_time', form.opening_time)
    body.append('closing_time', form.closing_time)
    if (imageFile) body.append('image', imageFile)

    try {
      const { data } = await api.post('/manager/restaurant', body)
      setRestaurant(data.restaurant)
      setImageFile(null)
      setSaveMessage('Changes saved successfully.')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save changes.'))
    } finally {
      setSaving(false)
    }
  }

  function openCreateTable() {
    setTableForm(emptyTableForm)
    setTableError('')
    setShowTableForm(true)
  }

  function openEditTable(table) {
    setTableForm({
      id: table.id,
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location || '',
      status: table.status,
    })
    setTableError('')
    setShowTableForm(true)
  }

  async function handleTableSubmit(e) {
    e.preventDefault()
    setTableSaving(true)
    setTableError('')

    const payload = {
      table_number: Number(tableForm.table_number),
      capacity: Number(tableForm.capacity),
      location: tableForm.location || null,
      status: tableForm.status,
    }

    try {
      if (tableForm.id) {
        await api.patch(`/tables/${tableForm.id}`, payload)
      } else {
        await api.post('/tables', payload)
      }
      setShowTableForm(false)
      fetchRestaurant()
    } catch (err) {
      setTableError(apiErrorMessage(err, 'Could not save this table.'))
    } finally {
      setTableSaving(false)
    }
  }

  async function handleDeleteTable(id) {
    if (!confirm('Delete this table?')) return
    setError('')
    try {
      await api.delete(`/tables/${id}`)
      fetchRestaurant()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this table.'))
    }
  }

  if (loading) return <p className="text-olive-500">Loading your restaurant...</p>
  if (!restaurant || !form) return <p className="text-red-600">{error || 'Could not load your restaurant.'}</p>

  const tables = restaurant.tables || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-olive-950">My Restaurant</h2>
        <p className="text-sm text-olive-500">Manage your restaurant's profile, capacity, hours and tables.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {saveMessage && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{saveMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        <div>
          <h3 className="mb-3 font-semibold text-olive-900">Basic Information</h3>
          <div className="mb-4 flex items-center gap-4">
            <img src={previewUrl} alt="" className="h-20 w-28 rounded-lg object-cover ring-1 ring-olive-100" />
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-olive-200 px-4 py-2 text-xs font-semibold text-olive-800 hover:bg-olive-50">
              <Upload size={14} /> Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Restaurant Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-olive-100 pt-6">
          <h3 className="mb-3 font-semibold text-olive-900">Capacity &amp; Hours</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Maximum Capacity (guests)</label>
              <input
                required
                type="number"
                min="1"
                value={form.max_capacity}
                onChange={(e) => setForm((f) => ({ ...f, max_capacity: e.target.value }))}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Opening Time</label>
              <input
                required
                type="time"
                value={form.opening_time}
                onChange={(e) => setForm((f) => ({ ...f, opening_time: e.target.value }))}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-olive-600">Closing Time</label>
              <input
                required
                type="time"
                value={form.closing_time}
                onChange={(e) => setForm((f) => ({ ...f, closing_time: e.target.value }))}
                className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-olive-400">
            Closing time can be after midnight (e.g. 12:00 AM) - reservations will respect these hours automatically.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-olive-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-olive-900">Tables</h3>
            <p className="text-xs text-olive-500">Only tables with enough seats are offered to customers for a given party size.</p>
          </div>
          <button
            onClick={openCreateTable}
            className="flex items-center gap-1 rounded-full bg-olive-800 px-4 py-2 text-sm font-semibold text-white hover:bg-olive-900"
          >
            <Plus size={16} /> Add Table
          </button>
        </div>

        {tables.length === 0 ? (
          <p className="text-sm text-olive-400">No tables yet. Add your first table above.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <div key={table.id} className="flex items-center justify-between rounded-xl border border-olive-100 p-3">
                <div>
                  <p className="font-semibold text-olive-950">Table {table.table_number}</p>
                  <p className="text-xs text-olive-500">
                    {table.capacity} seats{table.location ? ` · ${table.location}` : ''}
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${table.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {table.status === 'available' ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditTable(table)} className="rounded-full p-1.5 text-olive-600 hover:bg-olive-100">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDeleteTable(table.id)} className="rounded-full p-1.5 text-red-500 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTableForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-olive-950">{tableForm.id ? 'Edit Table' : 'Add Table'}</h3>
              <button onClick={() => setShowTableForm(false)} className="text-olive-500 hover:text-olive-900">
                <X size={20} />
              </button>
            </div>
            {tableError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{tableError}</p>}
            <form onSubmit={handleTableSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-olive-600">Table Number</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={tableForm.table_number}
                    onChange={(e) => setTableForm((f) => ({ ...f, table_number: e.target.value }))}
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-olive-600">Seats</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm((f) => ({ ...f, capacity: e.target.value }))}
                    className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Location (optional)</label>
                <input
                  value={tableForm.location}
                  onChange={(e) => setTableForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Window, Patio, Hall"
                  className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Status</label>
                <select
                  value={tableForm.status}
                  onChange={(e) => setTableForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={tableSaving}
                className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60"
              >
                {tableSaving ? 'Saving...' : 'Save Table'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
