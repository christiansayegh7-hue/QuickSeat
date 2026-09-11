import { useEffect, useState } from 'react'
import { FolderPlus, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import api, { apiErrorMessage } from '../../lib/api'
import { formatCurrency, menuItemImageUrl } from '../../utils/format'

const emptyForm = { id: null, category_id: '', name: '', description: '', price: '', is_available: true }
const emptyCategoryForm = { id: null, name: '', description: '', is_active: true }

export default function ManagerMenuItems() {
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categorySaving, setCategorySaving] = useState(false)

  function fetchRestaurant() {
    return api
      .get('/manager/restaurant')
      .then(({ data }) => setRestaurant(data.restaurant))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your restaurant.')))
      .finally(() => setLoading(false))
  }

  function reload() {
    setLoading(true)
    fetchRestaurant()
  }

  useEffect(() => {
    fetchRestaurant()
  }, [])

  const categories = restaurant?.categories || []

  function openCreate() {
    setForm({ ...emptyForm, category_id: categories[0]?.id || '' })
    setImageFile(null)
    setPreviewUrl('')
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
      is_available: !!item.is_available,
    })
    setImageFile(null)
    setPreviewUrl(menuItemImageUrl(item))
    setShowForm(true)
    setError('')
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
    body.append('category_id', form.category_id)
    body.append('name', form.name)
    body.append('description', form.description || '')
    body.append('price', form.price)
    body.append('is_available', form.is_available ? '1' : '0')
    if (imageFile) body.append('image', imageFile)

    try {
      if (form.id) {
        await api.post(`/menu-items/${form.id}`, body)
      } else {
        await api.post('/menu-items', body)
      }
      setShowForm(false)
      reload()
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
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this menu item.'))
    }
  }

  function openCreateCategory() {
    setCategoryForm(emptyCategoryForm)
    setShowCategoryForm(true)
    setError('')
  }

  function openEditCategory(category) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description || '',
      is_active: !!category.is_active,
    })
    setShowCategoryForm(true)
    setError('')
  }

  async function handleCategorySubmit(e) {
    e.preventDefault()
    setCategorySaving(true)
    setError('')
    try {
      if (categoryForm.id) {
        await api.patch(`/categories/${categoryForm.id}`, {
          name: categoryForm.name,
          description: categoryForm.description || null,
          is_active: categoryForm.is_active,
        })
      } else {
        // No restaurant_id sent - the backend infers it from the
        // authenticated manager's own restaurant.
        await api.post('/categories', {
          name: categoryForm.name,
          description: categoryForm.description || null,
          is_active: categoryForm.is_active,
        })
      }
      setShowCategoryForm(false)
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save this category.'))
    } finally {
      setCategorySaving(false)
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Delete this category? Its menu items will be deleted too.')) return
    try {
      await api.delete(`/categories/${id}`)
      reload()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this category.'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-olive-950">
          {restaurant ? `${restaurant.name} - Menu` : 'Menu Items'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={openCreateCategory}
            className="flex items-center gap-1 rounded-full border border-olive-300 px-4 py-2 text-sm font-semibold text-olive-800 hover:bg-olive-50"
          >
            <FolderPlus size={16} /> Add Category
          </button>
          <button
            onClick={openCreate}
            disabled={!categories.length}
            className="flex items-center gap-1 rounded-full bg-olive-800 px-4 py-2 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-50"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-olive-500">Loading menu...</p>
      ) : categories.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-olive-500 ring-1 ring-olive-100">
          You have no categories yet. Use "Add Category" above to create one (e.g. Starters, Main Course).
        </p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-semibold text-olive-900">{category.name}</h3>
                {!category.is_active && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Inactive</span>
                )}
                <button onClick={() => openEditCategory(category)} className="rounded-full p-1 text-olive-500 hover:bg-olive-100">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDeleteCategory(category.id)} className="rounded-full p-1 text-red-400 hover:bg-red-50">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(category.menu_items || []).map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-olive-100">
                    <img src={menuItemImageUrl(item)} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
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
                {(category.menu_items || []).length === 0 && (
                  <p className="text-sm text-olive-400">No items in this category.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-olive-950">{form.id ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={() => setShowForm(false)} className="text-olive-500 hover:text-olive-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-olive-600">Photo</p>
                <div className="flex items-center gap-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-olive-100" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-olive-50 ring-1 ring-olive-100" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-olive-200 px-4 py-2 text-xs font-semibold text-olive-800 hover:bg-olive-50">
                    <Upload size={14} /> Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                  </label>
                </div>
              </div>
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
              <button type="submit" disabled={saving} className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-olive-950">{categoryForm.id ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowCategoryForm(false)} className="text-olive-500 hover:text-olive-900">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Name</label>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Starters, Desserts"
                  className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-olive-600">Description (optional)</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-olive-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="cat-active"
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <label htmlFor="cat-active" className="text-sm text-olive-700">Active</label>
              </div>
              <button type="submit" disabled={categorySaving} className="w-full rounded-full bg-olive-800 py-2.5 text-sm font-semibold text-white hover:bg-olive-900 disabled:opacity-60">
                {categorySaving ? 'Saving...' : 'Save Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
