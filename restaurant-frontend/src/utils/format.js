export function formatCurrency(value) {
  const n = Number(value)
  return `$${Number.isFinite(n) ? n.toFixed(2) : '0.00'}`
}

export function averageRating(reviews) {
  if (!reviews || reviews.length === 0) return null
  const total = reviews.reduce((sum, r) => {
    const avg = (Number(r.rating_food) + Number(r.rating_service) + Number(r.rating_cleanliness)) / 3
    return sum + avg
  }, 0)
  return total / reviews.length
}

export function ratingBreakdown(reviews) {
  // Buckets 1..5 based on each review's overall rounded rating
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  if (!reviews) return buckets
  reviews.forEach((r) => {
    const avg = (Number(r.rating_food) + Number(r.rating_service) + Number(r.rating_cleanliness)) / 3
    const bucket = Math.min(5, Math.max(1, Math.round(avg)))
    buckets[bucket] += 1
  })
  return buckets
}

export function restaurantImage(id, variant = 0) {
  return `https://picsum.photos/seed/olive-restaurant-${id}-${variant}/800/600`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = Number(h)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = ((hour + 11) % 12) + 1
  return `${hour12}:${m} ${suffix}`
}

export function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + hours * 60
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const hh = Math.floor(wrapped / 60)
  const mm = wrapped % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function statusStyles(status) {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmed', className: 'text-green-700 bg-green-100' }
    case 'pending':
      return { label: 'Pending', className: 'text-amber-700 bg-amber-100' }
    case 'cancelled':
      return { label: 'Cancelled', className: 'text-red-700 bg-red-100' }
    case 'no_show':
      return { label: 'No Show', className: 'text-slate-700 bg-slate-200' }
    default:
      return { label: status || 'Unknown', className: 'text-slate-700 bg-slate-200' }
  }
}
